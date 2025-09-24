import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  TextInput,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useGroupStore } from '../../stores/groupStore';
import { AdminService } from '../../services/adminService';
import { UserRole } from '../../types';

const userSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  email: z.string().email('Invalid email address'),
  role: z.enum(['MEMBER', 'TREASURER', 'CHAIRPERSON', 'AUDITOR', 'ADMIN', 'SUPERADMIN']),
});

type UserFormData = z.infer<typeof userSchema>;

interface Credentials {
  email: string;
  password: string;
}

export default function UserManagementScreen() {
  const { members, currentGroup, loadMembers } = useGroupStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [resettingUser, setResettingUser] = useState<Profile | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      role: 'MEMBER',
    },
  });

  useEffect(() => {
    if (currentGroup) {
      loadMembers(currentGroup.id);
    }
  }, [currentGroup]);

  const onRefresh = async () => {
    setRefreshing(true);
    if (currentGroup) {
      await loadMembers(currentGroup.id);
    }
    setRefreshing(false);
  };

  const onSubmit = async (data: UserFormData) => {
    if (!currentGroup) {
      Alert.alert('Error', 'No group selected');
      return;
    }

    setIsLoading(true);
    
    try {
      // Generate password
      const password = AdminService.generatePassword();
      
      // Create user
      const result = await AdminService.createUser({
        ...data,
        password,
        group_id: currentGroup.id,
      });

      if (result.success) {
        setCredentials({
          email: data.email,
          password: password,
        });
        setShowCreateModal(false);
        setShowCredentialsModal(true);
        reset();
        
        // Refresh members list
        await loadMembers(currentGroup.id);
      } else {
        Alert.alert('Error', result.error || 'Failed to create user');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create user');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditUser = (user: Profile) => {
    setEditingUser(user);
    // Reset form with user data
    reset({
      full_name: user.full_name || '',
      phone: user.phone || '',
      email: user.email || '',
      role: (user.role as UserRole) || 'MEMBER',
    });
    setShowEditModal(true);
  };

  const handleCreateUser = () => {
    // Reset form to default values for new user
    reset({
      full_name: '',
      phone: '',
      email: '',
      role: 'MEMBER',
    });
    setShowCreateModal(true);
  };

  const handleUpdateUser = async (data: UserFormData) => {
    if (!editingUser) return;

    console.log('Updating user:', { userId: editingUser.id, data });
    setIsLoading(true);
    try {
      const result = await AdminService.updateUser(editingUser.id, {
        full_name: data.full_name,
        phone: data.phone,
        email: data.email,
        role: data.role,
      });

      console.log('Update result:', result);

      if (result.success) {
        Alert.alert('Success', 'User updated successfully');
        setShowEditModal(false);
        setEditingUser(null);
        reset();
        
        // Refresh members list
        if (currentGroup) {
          await loadMembers(currentGroup.id);
        }
      } else {
        Alert.alert('Error', result.error || 'Failed to update user');
      }
    } catch (error: any) {
      console.error('Update user error:', error);
      Alert.alert('Error', error.message || 'Failed to update user');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = (userId: string, userName: string) => {
    Alert.alert(
      'Delete User',
      `Are you sure you want to delete ${userName}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              const result = await AdminService.deleteUser(userId);
              if (result.success) {
                Alert.alert('Success', 'User deleted successfully');
                if (currentGroup) {
                  await loadMembers(currentGroup.id);
                }
              } else {
                Alert.alert('Error', result.error || 'Failed to delete user');
              }
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete user');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleResetPassword = (userId: string, userName: string) => {
    const user = members.find(m => m.id === userId);
    if (user) {
      setResettingUser(user);
      setNewPassword('');
      setShowPasswordModal(true);
    }
  };

  const handlePasswordReset = async () => {
    if (!resettingUser || !newPassword.trim()) {
      Alert.alert('Error', 'Please enter a password');
      return;
    }

    setIsLoading(true);
    try {
      const result = await AdminService.resetUserPassword(resettingUser.id, newPassword);
      
      if (result.success) {
        setCredentials({
          email: resettingUser.email || 'Email not set',
          password: newPassword,
        });
        setShowPasswordModal(false);
        setShowCredentialsModal(true);
        setResettingUser(null);
        setNewPassword('');
      } else {
        Alert.alert('Error', result.error || 'Failed to reset password');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    // In a real app, you'd use a clipboard library
    Alert.alert('Copied', 'Credentials copied to clipboard');
  };

  const getRoleColor = (role: string) => {
    const colors = {
      SUPERADMIN: '#DC2626',
      ADMIN: '#EA580C',
      TREASURER: '#059669',
      CHAIRPERSON: '#7C3AED',
      AUDITOR: '#0891B2',
      MEMBER: '#6B7280',
    };
    return colors[role as keyof typeof colors] || '#6B7280';
  };

  if (isLoading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Processing...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>User Management</Text>
        <Text style={styles.subtitle}>Create, edit, and manage group members ({members.length} total)</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleCreateUser}
        >
          <Text style={styles.addButtonText}>+ Add User</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.membersList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {members.map((member) => (
          <View key={member.id} style={styles.memberCard}>
            <View style={styles.memberHeader}>
              <View style={styles.memberBasicInfo}>
                <Text style={styles.memberName}>{member.full_name}</Text>
                <View style={[styles.roleBadge, { backgroundColor: getRoleColor(member.role) }]}>
                  <Text style={styles.roleText}>{member.role}</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.memberDetails}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Phone:</Text>
                <Text style={styles.detailValue}>{member.phone}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Email:</Text>
                <Text style={styles.detailValue}>{member.email || 'Not set'}</Text>
              </View>
            </View>

            <View style={styles.separator} />

            <View style={styles.memberActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleEditUser(member)}
              >
                <Text style={styles.actionButtonText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleResetPassword(member.id, member.full_name)}
              >
                <Text style={styles.actionButtonText}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => handleDeleteUser(member.id, member.full_name)}
              >
                <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Create User Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add New User</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                setShowCreateModal(false);
                reset();
              }}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name *</Text>
              <Controller
                control={control}
                name="full_name"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={[styles.input, errors.full_name && styles.inputError]}
                    value={value}
                    onChangeText={onChange}
                    placeholder="Enter full name"
                    autoComplete="name"
                  />
                )}
              />
              {errors.full_name && <Text style={styles.errorText}>{errors.full_name.message}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number *</Text>
              <Controller
                control={control}
                name="phone"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={[styles.input, errors.phone && styles.inputError]}
                    value={value}
                    onChangeText={onChange}
                    placeholder="Enter phone number"
                    keyboardType="phone-pad"
                    autoComplete="tel"
                  />
                )}
              />
              {errors.phone && <Text style={styles.errorText}>{errors.phone.message}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address *</Text>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={[styles.input, errors.email && styles.inputError]}
                    value={value}
                    onChangeText={onChange}
                    placeholder="Enter email address"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                  />
                )}
              />
              {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Role *</Text>
              <Controller
                control={control}
                name="role"
                render={({ field: { onChange, value } }) => (
                  <View style={styles.roleSelector}>
                    {(['MEMBER', 'TREASURER', 'CHAIRPERSON', 'AUDITOR', 'ADMIN'] as UserRole[]).map((role) => (
                      <TouchableOpacity
                        key={role}
                        style={[
                          styles.roleOption,
                          value === role && styles.roleOptionSelected,
                        ]}
                        onPress={() => onChange(role)}
                      >
                        <Text style={[
                          styles.roleOptionText,
                          value === role && styles.roleOptionTextSelected,
                        ]}>
                          {role}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              />
              {errors.role && <Text style={styles.errorText}>{errors.role.message}</Text>}
            </View>
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setShowCreateModal(false);
                reset();
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={handleSubmit(onSubmit)}
              disabled={isSubmitting}
            >
              <Text style={styles.submitButtonText}>
                {isSubmitting ? 'Creating...' : 'Create User'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit User</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                setShowEditModal(false);
                setEditingUser(null);
                reset();
              }}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name *</Text>
              <Controller
                control={control}
                name="full_name"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={[styles.input, errors.full_name && styles.inputError]}
                    value={value}
                    onChangeText={onChange}
                    placeholder="Enter full name"
                    autoComplete="name"
                  />
                )}
              />
              {errors.full_name && <Text style={styles.errorText}>{errors.full_name.message}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number *</Text>
              <Controller
                control={control}
                name="phone"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={[styles.input, errors.phone && styles.inputError]}
                    value={value}
                    onChangeText={onChange}
                    placeholder="Enter phone number"
                    keyboardType="phone-pad"
                    autoComplete="tel"
                  />
                )}
              />
              {errors.phone && <Text style={styles.errorText}>{errors.phone.message}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address *</Text>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={[styles.input, errors.email && styles.inputError]}
                    value={value}
                    onChangeText={onChange}
                    placeholder="Enter email address"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                  />
                )}
              />
              {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Role *</Text>
              <Controller
                control={control}
                name="role"
                render={({ field: { onChange, value } }) => (
                  <View style={styles.roleSelector}>
                    {(['MEMBER', 'TREASURER', 'CHAIRPERSON', 'AUDITOR', 'ADMIN'] as UserRole[]).map((role) => (
                      <TouchableOpacity
                        key={role}
                        style={[
                          styles.roleOption,
                          value === role && styles.roleOptionSelected,
                        ]}
                        onPress={() => onChange(role)}
                      >
                        <Text style={[
                          styles.roleOptionText,
                          value === role && styles.roleOptionTextSelected,
                        ]}>
                          {role}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              />
              {errors.role && <Text style={styles.errorText}>{errors.role.message}</Text>}
            </View>
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setShowEditModal(false);
                setEditingUser(null);
                reset();
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={handleSubmit(handleUpdateUser)}
              disabled={isSubmitting}
            >
              <Text style={styles.submitButtonText}>
                {isSubmitting ? 'Updating...' : 'Update User'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Credentials Modal */}
      <Modal
        visible={showCredentialsModal}
        animationType="fade"
        transparent={true}
      >
        <View style={styles.credentialsOverlay}>
          <View style={styles.credentialsModal}>
            <Text style={styles.credentialsTitle}>User Credentials</Text>
            <Text style={styles.credentialsSubtitle}>
              Share these credentials with the user securely
            </Text>
            
            <View style={styles.credentialsContainer}>
              <View style={styles.credentialItem}>
                <Text style={styles.credentialLabel}>Email:</Text>
                <View style={styles.credentialValue}>
                  <Text style={styles.credentialText}>{credentials?.email}</Text>
                  <TouchableOpacity
                    style={styles.copyButton}
                    onPress={() => copyToClipboard(credentials?.email || '')}
                  >
                    <Text style={styles.copyButtonText}>Copy</Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={styles.credentialItem}>
                <Text style={styles.credentialLabel}>Password:</Text>
                <View style={styles.credentialValue}>
                  <Text style={styles.credentialText}>{credentials?.password}</Text>
                  <TouchableOpacity
                    style={styles.copyButton}
                    onPress={() => copyToClipboard(credentials?.password || '')}
                  >
                    <Text style={styles.copyButtonText}>Copy</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={styles.credentialsActions}>
              <TouchableOpacity
                style={styles.credentialsButton}
                onPress={() => setShowCredentialsModal(false)}
              >
                <Text style={styles.credentialsButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Password Reset Modal */}
      <Modal
        visible={showPasswordModal}
        animationType="fade"
        transparent={true}
      >
        <View style={styles.passwordOverlay}>
          <View style={styles.passwordModal}>
            <Text style={styles.passwordTitle}>Reset Password</Text>
            <Text style={styles.passwordSubtitle}>
              Enter new password for {resettingUser?.full_name}
            </Text>
            
            <View style={styles.passwordInputContainer}>
              <View style={styles.passwordLabelRow}>
                <Text style={styles.passwordLabel}>New Password:</Text>
                <TouchableOpacity
                  style={styles.generateButton}
                  onPress={() => setNewPassword(AdminService.generatePassword())}
                >
                  <Text style={styles.generateButtonText}>Generate</Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={styles.passwordInput}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Enter new password"
                secureTextEntry={true}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.passwordActions}>
              <TouchableOpacity
                style={styles.passwordCancelButton}
                onPress={() => {
                  setShowPasswordModal(false);
                  setResettingUser(null);
                  setNewPassword('');
                }}
              >
                <Text style={styles.passwordCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.passwordResetButton, (!newPassword.trim() || isLoading) && styles.passwordResetButtonDisabled]}
                onPress={handlePasswordReset}
                disabled={!newPassword.trim() || isLoading}
              >
                <Text style={styles.passwordResetButtonText}>
                  {isLoading ? 'Resetting...' : 'Reset Password'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 4,
  },
  actions: {
    padding: 20,
  },
  addButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  membersList: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  memberCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  memberHeader: {
    marginBottom: 16,
  },
  memberBasicInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  memberName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginLeft: 12,
  },
  roleText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  memberDetails: {
    marginBottom: 16,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    width: 60,
  },
  detailValue: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
    fontFamily: 'monospace',
  },
  separator: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 12,
  },
  memberActions: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-end',
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  actionButtonText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  deleteButtonText: {
    color: '#DC2626',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#6B7280',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginTop: 4,
  },
  disabledInput: {
    backgroundColor: '#F9FAFB',
    color: '#6B7280',
  },
  helpText: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
  roleSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  roleOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  roleOptionSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  roleOptionText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  roleOptionTextSelected: {
    color: '#FFFFFF',
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  submitButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  credentialsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  credentialsModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  credentialsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
  },
  credentialsSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  credentialsContainer: {
    gap: 16,
  },
  credentialItem: {
    gap: 8,
  },
  credentialLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  credentialValue: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  credentialText: {
    fontSize: 16,
    color: '#111827',
    fontFamily: 'monospace',
    flex: 1,
  },
  copyButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#3B82F6',
    borderRadius: 6,
    marginLeft: 8,
  },
  copyButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  credentialsActions: {
    marginTop: 24,
  },
  credentialsButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  credentialsButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  passwordOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  passwordModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  passwordTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
  },
  passwordSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  passwordInputContainer: {
    marginBottom: 24,
  },
  passwordLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  passwordLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  generateButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  generateButtonText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  passwordInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  passwordActions: {
    flexDirection: 'row',
    gap: 12,
  },
  passwordCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  passwordCancelButtonText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  passwordResetButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
  },
  passwordResetButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  passwordResetButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
