import React, { useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function Profile() {
  const [profileImage, setProfileImage] = useState('');
  const [profileName, setProfileName] = useState('Adriel');
  const [profileRole, setProfileRole] = useState('Traffic Officer');
  const [totalViolations, setTotalViolations] = useState(124);
  const [violationMonth, setViolationMonth] = useState(12);
  const [mostCommon, setMostCommon] = useState('No Parking Zone');

  const changeAvatar = () => {
    Alert.alert(
      'Avatar Change Complete 🎉',
      'The image has been successfully uploaded!',
      [{ text: 'OK' }]
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.pageContainer}>
      {/* --- Profile Header --- */}
      <View style={styles.profileHeader}>
        <Image
          source={
            profileImage
              ? { uri: profileImage }
              : require('@/assets/images/react-logo.png') // replace with your placeholder image
          }
          style={styles.avatar}
        />
        <View style={styles.profileInfo}>
          <Text style={styles.nameText}>Welcome, {profileName || 'User'}</Text>
          <Text style={styles.roleText}>Role: {profileRole || 'Staff'}</Text>
          <TouchableOpacity onPress={changeAvatar}>
            <Text style={styles.changeAvatar}>Change Avatar</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* --- Dashboard Summary --- */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <Text style={styles.summaryTitle}>Dashboard Summary</Text>
          <TouchableOpacity style={styles.exportButton}>
            <Text style={styles.exportText}>Export PDF</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Total Violations</Text>
            <Text style={styles.statValue}>{totalViolations}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>This Month</Text>
            <Text style={styles.statValue}>{violationMonth}</Text>
          </View>
        </View>

        <View style={styles.statBoxFull}>
          <Text style={styles.statLabel}>Most Common Violation</Text>
          <Text style={styles.statValue}>{mostCommon}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pageContainer: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#f4f6fb',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    elevation: 3,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 50,
    backgroundColor: '#e0e0e0',
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  nameText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  roleText: {
    fontSize: 14,
    color: '#555',
    marginVertical: 4,
  },
  changeAvatar: {
    fontSize: 14,
    color: '#007BFF',
    fontWeight: '600',
    marginTop: 6,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    elevation: 3,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  exportButton: {
    backgroundColor: '#007BFF',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  exportText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#f8f9ff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  statBoxFull: {
    backgroundColor: '#f8f9ff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  statLabel: {
    fontSize: 13,
    color: '#555',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#222',
    marginTop: 4,
  },
});
