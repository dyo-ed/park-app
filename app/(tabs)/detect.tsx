import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { useVideoPlayer, VideoSource, VideoView } from 'expo-video';
import React, { useEffect, useState } from 'react';
import { Alert, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function VideoUpload() {
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [processedVideoUri, setProcessedVideoUri] = useState<string | null>(null);

  // --- Watch for when processed video becomes available ---
  useEffect(() => {
    if (processedVideoUri) {
      Alert.alert(
        'Processing Complete 🎉',
        'The video has been successfully processed!',
        [{ text: 'OK' }]
      );
    }
  }, [processedVideoUri]);

  const source: VideoSource | undefined =
  processedVideoUri
    ? { uri: processedVideoUri }
    : videoUri
    ? { uri: videoUri }
    : undefined;

  const player = useVideoPlayer(source || { uri: '' }, (player) => {
    if (source) {
      player.loop = true;
      player.play();
    }
  });

  // --- Pick video from gallery ---
  const pickVideo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      quality: 1,
    });
    if (!result.canceled && result.assets.length > 0) {
      setVideoUri(result.assets[0].uri);
    }
  };

  // --- Upload and receive processed video ---
  const uploadVideo = async () => {
    if (!videoUri) return alert('Pick a video first');

    const formData = new FormData();
    formData.append('video', {
      uri: Platform.OS === 'ios' ? videoUri.replace('file://', '') : videoUri,
      type: 'video/mp4',
      name: 'input.mp4',
    } as any);

    try {
      const response = await fetch('http://192.168.0.107:5000/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'multipart/form-data' },
        body: formData,
      });

      // Convert response to ArrayBuffer
      const arrayBuffer = await response.arrayBuffer();

      // Save locally in cache directory
      const fileUri = `${FileSystem.cacheDirectory}processed_video.mp4`;
      await FileSystem.writeAsStringAsync(fileUri, arrayBufferToBase64(arrayBuffer), {
        encoding: FileSystem.EncodingType.Base64,
      });

      // ✅ Trigger popup via state watcher
      setProcessedVideoUri(fileUri);
    } catch (err) {
      console.error('Upload/processing error:', err);
      Alert.alert('Error', 'Something went wrong during upload or processing.');
    }
  };

  // Convert ArrayBuffer to Base64
  const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const chunkSize = 0x8000; // 32KB chunks
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, i + chunkSize);
      binary += String.fromCharCode(...chunk);
    }
    return btoa(binary);
  };

  return (
    <View style={styles.pageContainer}>
      <View style={styles.container}>
        <TouchableOpacity style={styles.button} onPress={pickVideo}>
          <Text style={styles.buttonText}>Pick Video</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.container}>
        <TouchableOpacity style={styles.button} onPress={uploadVideo}>
          <Text style={styles.buttonText}>Start Detection</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.detailsContainer}>
        <Text>Vehicle Parked in No Parking Zone</Text>
        <Text>Location: Zone A, Camera 2</Text>
        <Text>Time: 2:54:47 PM</Text>
        <Text>Evidence Captured from CCTV Image</Text>
      </View>

      {source && (
        <>
          <Text style={{ marginTop: 10 }}>
            {processedVideoUri ? 'Processed Video:' : 'Original Video:'}
          </Text>
          <VideoView
            player={player} // non-null assertion if you’re sure it exists
            style={{ width: 300, height: 200 }}
            nativeControls={true}
            contentFit="contain"
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  pageContainer: {
    padding: 20,
    height: '100%',
    backgroundColor: '#284cc51a',
  },
  container: {
    padding: 16,
  },
  button: {
    backgroundColor: '#007BFF',
    borderRadius: 50,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  detailsContainer: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
  },
});
