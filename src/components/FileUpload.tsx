import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { StorageService, FileUpload } from '../services/storage';

interface FileUploadProps {
  onFileSelected: (file: FileUpload) => void;
  onFileUploaded: (url: string) => void;
  onFileRemoved: () => void;
  currentFile?: string;
  folder?: string;
  userId: string;
  disabled?: boolean;
}

export default function FileUpload({
  onFileSelected,
  onFileUploaded,
  onFileRemoved,
  currentFile,
  folder = 'general',
  userId,
  disabled = false,
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  const handleImagePicker = async () => {
    const file = await StorageService.pickImage();
    if (file) {
      await handleFileUpload(file);
    }
    setShowOptions(false);
  };

  const handleCamera = async () => {
    const file = await StorageService.takePhoto();
    if (file) {
      await handleFileUpload(file);
    }
    setShowOptions(false);
  };

  const handleDocumentPicker = async () => {
    const file = await StorageService.pickDocument();
    if (file) {
      await handleFileUpload(file);
    }
    setShowOptions(false);
  };

  const handleFileUpload = async (file: FileUpload) => {
    setUploading(true);
    try {
      onFileSelected(file);
      
      const result = await StorageService.uploadFile(file, folder, userId);
      
      if (result.success && result.url) {
        onFileUploaded(result.url);
      } else {
        Alert.alert('Upload Failed', result.error || 'Unknown error occurred');
      }
    } catch (error) {
      Alert.alert('Upload Error', 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveFile = () => {
    Alert.alert(
      'Remove File',
      'Are you sure you want to remove this file?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: onFileRemoved }
      ]
    );
  };

  const getFileTypeIcon = (url: string) => {
    if (url.includes('.pdf')) return '📄';
    if (url.includes('.jpg') || url.includes('.jpeg') || url.includes('.png')) return '🖼️';
    return '📎';
  };

  const isImage = (url: string) => {
    return url.includes('.jpg') || url.includes('.jpeg') || url.includes('.png') || url.includes('.gif');
  };

  return (
    <View style={styles.container}>
      {currentFile ? (
        <View style={styles.fileContainer}>
          <View style={styles.fileInfo}>
            <Text style={styles.fileIcon}>
              {isImage(currentFile) ? '🖼️' : getFileTypeIcon(currentFile)}
            </Text>
            <View style={styles.fileDetails}>
              <Text style={styles.fileName}>
                {currentFile.split('/').pop() || 'Unknown file'}
              </Text>
              <Text style={styles.fileUrl}>
                {currentFile.length > 50 ? `${currentFile.substring(0, 50)}...` : currentFile}
              </Text>
            </View>
          </View>
          
          {!disabled && (
            <TouchableOpacity
              style={styles.removeButton}
              onPress={handleRemoveFile}
            >
              <Text style={styles.removeButtonText}>Remove</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.uploadButton, disabled && styles.uploadButtonDisabled]}
          onPress={() => setShowOptions(true)}
          disabled={disabled || uploading}
        >
          <Text style={styles.uploadButtonText}>
            {uploading ? 'Uploading...' : '+ Upload File'}
          </Text>
        </TouchableOpacity>
      )}

      {/* Upload Options Modal */}
      <Modal visible={showOptions} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Upload File</Text>
            <TouchableOpacity onPress={() => setShowOptions(false)}>
              <Text style={styles.modalCloseButton}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.optionButton}
              onPress={handleImagePicker}
            >
              <Text style={styles.optionIcon}>🖼️</Text>
              <Text style={styles.optionTitle}>Choose from Gallery</Text>
              <Text style={styles.optionDescription}>Select an image from your photo library</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionButton}
              onPress={handleCamera}
            >
              <Text style={styles.optionIcon}>📷</Text>
              <Text style={styles.optionTitle}>Take Photo</Text>
              <Text style={styles.optionDescription}>Take a new photo with your camera</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionButton}
              onPress={handleDocumentPicker}
            >
              <Text style={styles.optionIcon}>📄</Text>
              <Text style={styles.optionTitle}>Choose Document</Text>
              <Text style={styles.optionDescription}>Select a PDF or text document</Text>
            </TouchableOpacity>

            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>File Requirements</Text>
              <Text style={styles.infoText}>
                • Maximum file size: 10MB{'\n'}
                • Supported formats: JPEG, PNG, GIF, PDF, TXT{'\n'}
                • Files are stored securely and privately
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  uploadButton: {
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
  },
  uploadButtonDisabled: {
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
  },
  uploadButtonText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  fileContainer: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  fileIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  fileDetails: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  fileUrl: {
    fontSize: 12,
    color: '#6B7280',
  },
  removeButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  removeButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  modalCloseButton: {
    fontSize: 16,
    color: '#3B82F6',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  optionButton: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  optionIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  infoBox: {
    backgroundColor: '#EFF6FF',
    padding: 16,
    borderRadius: 8,
    marginTop: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E40AF',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#1E40AF',
    lineHeight: 20,
  },
});
