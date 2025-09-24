import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useGroupStore } from '../../stores/groupStore';
import { supabase } from '../../services/supabase';
import { Profile } from '../../types';

export default function ManageGroupMembersScreen() {
  const { currentGroup, loadMembers } = useGroupStore();
  const [allUsers, setAllUsers] = useState<Profile[]>([]);
  const [groupMembers, setGroupMembers] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (currentGroup) {
      loadAllUsers();
      loadGroupMembers();
    }
  }, [currentGroup]);

  const loadAllUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name');

      if (error) throw error;
      setAllUsers(data || []);
    } catch (error: any) {
      console.error('Error loading all users:', error);
      Alert.alert('Error', 'Failed to load users');
    }
  };

  const loadGroupMembers = async () => {
    if (!currentGroup) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('group_id', currentGroup.id)
        .order('full_name');

      if (error) throw error;
      setGroupMembers(data || []);
    } catch (error: any) {
      console.error('Error loading group members:', error);
      Alert.alert('Error', 'Failed to load group members');
    }
  };

  const addUserToGroup = async (user: Profile) => {
    if (!currentGroup) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ group_id: currentGroup.id })
        .eq('id', user.id);

      if (error) throw error;

      Alert.alert('Success', `${user.full_name} has been added to the group`);
      
      // Refresh both lists
      await loadAllUsers();
      await loadGroupMembers();
      
      // Also refresh the group store
      await loadMembers(currentGroup.id);
    } catch (error: any) {
      console.error('Error adding user to group:', error);
      Alert.alert('Error', `Failed to add ${user.full_name} to group`);
    } finally {
      setIsLoading(false);
    }
  };

  const removeUserFromGroup = async (user: Profile) => {
    if (!currentGroup) return;

    Alert.alert(
      'Remove User',
      `Are you sure you want to remove ${user.full_name} from the group?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              const { error } = await supabase
                .from('profiles')
                .update({ group_id: null })
                .eq('id', user.id);

              if (error) throw error;

              Alert.alert('Success', `${user.full_name} has been removed from the group`);
              
              // Refresh both lists
              await loadAllUsers();
              await loadGroupMembers();
              
              // Also refresh the group store
              await loadMembers(currentGroup.id);
            } catch (error: any) {
              console.error('Error removing user from group:', error);
              Alert.alert('Error', `Failed to remove ${user.full_name} from group`);
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const addAllUsersToGroup = async () => {
    if (!currentGroup) return;

    const usersToAdd = allUsers.filter(user => !user.group_id);
    
    if (usersToAdd.length === 0) {
      Alert.alert('Info', 'All users are already in a group');
      return;
    }

    Alert.alert(
      'Add All Users',
      `Add ${usersToAdd.length} users to the group?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Add All',
          onPress: async () => {
            setIsLoading(true);
            try {
              const { error } = await supabase
                .from('profiles')
                .update({ group_id: currentGroup.id })
                .in('id', usersToAdd.map(user => user.id));

              if (error) throw error;

              Alert.alert('Success', `${usersToAdd.length} users have been added to the group`);
              
              // Refresh both lists
              await loadAllUsers();
              await loadGroupMembers();
              
              // Also refresh the group store
              await loadMembers(currentGroup.id);
            } catch (error: any) {
              console.error('Error adding all users to group:', error);
              Alert.alert('Error', 'Failed to add users to group');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadAllUsers(), loadGroupMembers()]);
    setRefreshing(false);
  };

  const usersNotInGroup = allUsers.filter(user => !user.group_id);
  const usersInOtherGroups = allUsers.filter(user => user.group_id && user.group_id !== currentGroup?.id);

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Manage Group Members</Text>
        <Text style={styles.subtitle}>
          {currentGroup?.name} ({groupMembers.length} members)
        </Text>
      </View>

      {/* Add All Users Button */}
      {usersNotInGroup.length > 0 && (
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.addAllButton}
            onPress={addAllUsersToGroup}
            disabled={isLoading}
          >
            <Text style={styles.addAllButtonText}>
              + Add All {usersNotInGroup.length} Users to Group
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Current Group Members */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Current Group Members ({groupMembers.length})</Text>
        {groupMembers.length === 0 ? (
          <Text style={styles.emptyText}>No members in this group</Text>
        ) : (
          groupMembers.map((member) => (
            <View key={member.id} style={styles.memberCard}>
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{member.full_name}</Text>
                <Text style={styles.memberRole}>{member.role}</Text>
                <Text style={styles.memberPhone}>{member.phone}</Text>
              </View>
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeUserFromGroup(member)}
                disabled={isLoading}
              >
                <Text style={styles.removeButtonText}>Remove</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>

      {/* Users Not in Any Group */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Available Users ({usersNotInGroup.length})</Text>
        {usersNotInGroup.length === 0 ? (
          <Text style={styles.emptyText}>No available users</Text>
        ) : (
          usersNotInGroup.map((user) => (
            <View key={user.id} style={styles.memberCard}>
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{user.full_name}</Text>
                <Text style={styles.memberRole}>{user.role}</Text>
                <Text style={styles.memberPhone}>{user.phone}</Text>
              </View>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => addUserToGroup(user)}
                disabled={isLoading}
              >
                <Text style={styles.addButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>

      {/* Users in Other Groups */}
      {usersInOtherGroups.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Users in Other Groups ({usersInOtherGroups.length})</Text>
          {usersInOtherGroups.map((user) => (
            <View key={user.id} style={[styles.memberCard, styles.disabledCard]}>
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{user.full_name}</Text>
                <Text style={styles.memberRole}>{user.role}</Text>
                <Text style={styles.memberPhone}>{user.phone}</Text>
              </View>
              <Text style={styles.disabledText}>In Other Group</Text>
            </View>
          ))}
        </View>
      )}

      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Processing...</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
  },
  addAllButton: {
    backgroundColor: '#10B981',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  addAllButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  memberCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  disabledCard: {
    opacity: 0.6,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  memberRole: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  memberPhone: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  addButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  removeButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  removeButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  disabledText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontStyle: 'italic',
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: 20,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 16,
    color: '#6B7280',
  },
});
