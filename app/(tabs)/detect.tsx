import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import dayjs from 'dayjs';
import * as ImagePicker from 'expo-image-picker';
import { useVideoPlayer, VideoSource, VideoView } from 'expo-video';
import * as VideoThumbnails from 'expo-video-thumbnails';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Polygon } from 'react-native-svg';

const { width } = Dimensions.get('window');

export default function VideoUpload() {
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [processedVideoUri, setProcessedVideoUri] = useState<string | null>(null);
  const [violationCount, setViolationCount] = useState(0);
  const [coords, setCoords] = useState<{ x: number; y: number }[]>([]);
  const [mobileCoords, setMobileCoords] = useState<{ x: number; y: number }[]>([]);
  const [videoResolution, setVideoResolution] = useState<{ width: number; height: number } | null>(null);
  const [svgSize, setSvgSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [selectingROI, setSelectingROI] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [loading, setLoading] = useState(false);

  const [violationType, setViolationType] = useState('Vehicle Parked in No Parking Zone');
  const [location, setLocation] = useState('Zone A, Camera 2');
  const [timeCaught, setTimeCaught] = useState(dayjs().format('hh:mm:ss A'));
  const [evidence, setEvidence] = useState('Evidence Captured from CCTV Image');

  const svgRef = useRef<View>(null);

  // --- Video Player ---
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

  // --- After Processing ---
  useEffect(() => {
    if (processedVideoUri) {
      Alert.alert('Processing Complete 🎉', 'The video has been successfully processed!');
    }
  }, [processedVideoUri]);

  // --- Pick Video from Gallery ---
  const pickVideo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      quality: 1,
    });
    if (!result.canceled && result.assets.length > 0) {
      const uri = result.assets[0].uri;
      setVideoUri(uri);
      setProcessedVideoUri(null);
      setCoords([]);
      setViolationCount(0);
      getVideoResolution(uri);
    }
  };

  const getVideoResolution = async (uri: string) => {
    const { width, height } = await VideoThumbnails.getThumbnailAsync(uri, { time: 0 });
    console.log('Video resolution:', width, height);
    setVideoResolution({ width, height });
  };

  // --- Upload Video to Flask ---
  const uploadVideo = async () => {
    const api_url = await AsyncStorage.getItem('server-http');
    console.log(api_url)
    if (!videoUri) return alert('Pick a video first');

    setProcessing(false);
    setUploadProgress(0);
    setProcessedVideoUri(null);
    setViolationCount(0);

    const formData = new FormData();
    console.log(formData)
    formData.append('video', {
      uri: Platform.OS === 'ios' ? videoUri.replace('file://', '') : videoUri,
      type: 'video/mp4',
      name: 'input.mp4',
    } as any);

    if (coords.length >= 3) {
      formData.append('coords', JSON.stringify(coords));
    }

    try {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${'http://192.168.0.107:5000'}/upload`);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(progress);
        }
      };

      xhr.onloadstart = () => setProcessing(true);
      xhr.onloadend = () => setProcessing(false);

      xhr.onload = () => {
        if (xhr.status === 200) {
          try {
            const data = JSON.parse(xhr.responseText);
            setViolationCount(data.tracked_objects || 0);
            setProcessedVideoUri(data.video_url);
          } catch (err) {
            Alert.alert('Error', 'Invalid server response');
          }
        } else {
          Alert.alert('Upload Failed', `Status ${xhr.status}`);
        }
      };

      xhr.onerror = () => {
        Alert.alert('Network Error', 'Could not upload video');
        setProcessing(false);
      };

      xhr.send(formData);
    } catch (err: any) {
      setProcessing(false);
      Alert.alert('Error', err.message || 'Unknown error');
    }
  };

  // --- Save Violation Record ---
  const handleSave = async () => {
    if (!processedVideoUri) return Alert.alert('⚠️', 'Process a video before saving.');
    const userId = await AsyncStorage.getItem('user_id');

    try {
      setLoading(true);
      const { error } = await supabase.from('violation_history').insert([
        {
          profile: userId,
          recorded_number: violationCount,
          violation_type: violationType,
          location,
          time_caught: timeCaught,
          evidence,
        },
      ]);

      if (error) throw error;
      Alert.alert('✅ Success', 'Violation record saved successfully!');
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // --- Handle ROI Tap ---
  const handleTap = (evt: any) => {
    if (!selectingROI || !videoResolution || !svgSize.width || !svgSize.height) return;

    const { locationX, locationY } = evt.nativeEvent;

    // --- 1️⃣ Determine video aspect ratio and displayed size within the SVG area ---
    const videoAspect = videoResolution.width / videoResolution.height;
    const displayAspect = svgSize.width / svgSize.height;

    let displayedVideoWidth, displayedVideoHeight, offsetX, offsetY;

    if (videoAspect > displayAspect) {
      // Video is wider (letterbox top/bottom)
      displayedVideoWidth = svgSize.width;
      displayedVideoHeight = svgSize.width / videoAspect;
      offsetX = 0;
      offsetY = (svgSize.height - displayedVideoHeight) / 2;
    } else {
      // Video is taller (pillarbox sides)
      displayedVideoHeight = svgSize.height;
      displayedVideoWidth = svgSize.height * videoAspect;
      offsetY = 0;
      offsetX = (svgSize.width - displayedVideoWidth) / 2;
    }

    // --- 2️⃣ Adjust for the padding (offset) ---
    const adjX = locationX - offsetX;
    const adjY = locationY - offsetY;

    // If user taps outside actual video area, ignore it
    if (adjX < 0 || adjY < 0 || adjX > displayedVideoWidth || adjY > displayedVideoHeight) {
      console.log("🚫 Tap outside video bounds");
      return;
    }

    // --- 3️⃣ Scale adjusted coordinates to actual video resolution ---
    const scaleX = videoResolution.width / displayedVideoWidth;
    const scaleY = videoResolution.height / displayedVideoHeight;

    const realX = adjX * scaleX;
    const realY = adjY * scaleY;

    setMobileCoords((prev) => [...prev, { x: locationX, y: locationY }]);
    setCoords((prev) => [...prev, { x: realX, y: realY }]);

    console.log("🎥 Video Resolution:", videoResolution);
    console.log("🧭 SVG Display Size:", svgSize);
    console.log("📺 Displayed Video:", { displayedVideoWidth, displayedVideoHeight, offsetX, offsetY });
    console.log(`📱 Tap: (${locationX.toFixed(1)}, ${locationY.toFixed(1)})`);
    console.log(`🎞️ Real: (${realX.toFixed(1)}, ${realY.toFixed(1)})`);
  };

  const resetPolygon = () => {
    setCoords([]);
    setMobileCoords([]);
  };

  return (
    <ScrollView style={styles.pageContainer}>
      {/* Pick & Upload */}
      <View style={styles.container}>
        <TouchableOpacity style={styles.button} onPress={pickVideo}>
          <Text style={styles.buttonText}>🎥 Pick Video</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.container}>
        <TouchableOpacity style={styles.button} onPress={() => setSelectingROI(!selectingROI)}>
          <Text style={styles.buttonText}>
            {selectingROI ? '✅ Finish ROI Selection' : '📍 Set Tracking Area'}
          </Text>
        </TouchableOpacity>
        {selectingROI && (
          <TouchableOpacity
            style={[styles.button, { backgroundColor: '#dc3545', marginTop: 10 }]}
            onPress={resetPolygon}
          >
            <Text style={styles.buttonText}>Reset Polygon</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.container}>
        <TouchableOpacity style={styles.button} onPress={uploadVideo}>
          <Text style={styles.buttonText}>🚦 Start Detection</Text>
        </TouchableOpacity>
      </View>

      {/* Video Preview */}
      {videoUri && (
        <View style={styles.videoWrapper}>
          <VideoView
            player={player}
            style={{ width: width - 40, height: 200 }}
            nativeControls
            contentFit="contain"
          />
          {selectingROI && (
            <View
              style={StyleSheet.absoluteFill}
              pointerEvents="box-none"
              onStartShouldSetResponder={() => true}
              onResponderRelease={handleTap}
            >
              <View
                style={{ width: width - 40, height: 200 }}
                onLayout={(event) => {
                  const { width: w, height: h } = event.nativeEvent.layout;
                  setSvgSize({ width: w, height: h });
                }}
              >
                <Svg style={{ flex: 1 }} viewBox={`0 0 ${width - 40} 200`}>
                  {mobileCoords.length > 0 && (
                    <Polygon
                      points={mobileCoords.map((p) => `${p.x},${p.y}`).join(' ')}
                      fill="rgba(255,255,0,0.2)"
                      stroke="yellow"
                      strokeWidth="2"
                    />
                  )}
                  {mobileCoords.map((p, idx) => (
                    <Circle key={idx} cx={p.x} cy={p.y} r={5} fill="red" />
                  ))}
                </Svg>
              </View>
            </View>
          )}
        </View>
      )}

      {/* Progress Indicators */}
      {uploadProgress > 0 && uploadProgress < 100 && (
        <View style={{ marginVertical: 15 }}>
          <Text style={{ fontWeight: '600' }}>Uploading: {uploadProgress}%</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${uploadProgress}%` }]} />
          </View>
        </View>
      )}

      {processing && (
        <View style={{ alignItems: 'center', marginVertical: 10 }}>
          <ActivityIndicator size="large" color="#007BFF" />
          <Text style={{ marginTop: 6 }}>Processing video on server...</Text>
        </View>
      )}

      {/* Violation Info */}
      <View style={styles.detailsContainer}>
        <Text style={styles.label}>Violations Caught: {violationCount}</Text>

        <TextInput style={styles.input} value={violationType} onChangeText={setViolationType} placeholder="Violation Type" />
        <TextInput style={styles.input} value={location} onChangeText={setLocation} placeholder="Location" />
        <TextInput style={styles.input} value={timeCaught} onChangeText={setTimeCaught} placeholder="Time Caught" />
        <TextInput style={styles.input} value={evidence} onChangeText={setEvidence} placeholder="Evidence" />

        <TouchableOpacity
          style={[styles.button, { backgroundColor: loading ? '#ccc' : '#007BFF' }]}
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? 'Saving...' : '💾 Save Violation'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pageContainer: { padding: 20, backgroundColor: '#f6f7fb' },
  container: { padding: 8 },
  button: { backgroundColor: '#007BFF', borderRadius: 50, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', width: '100%' },
  buttonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  videoWrapper: { alignItems: 'center', marginTop: 10 },
  progressBar: { width: '100%', height: 6, backgroundColor: '#ccc', borderRadius: 3, marginTop: 4 },
  progressFill: { height: 6, backgroundColor: '#007BFF', borderRadius: 3 },
  detailsContainer: { backgroundColor: '#fff', borderRadius: 18, padding: 16, marginTop: 20 },
  label: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  input: { backgroundColor: '#fff', padding: 10, borderRadius: 8, borderColor: '#ccc', borderWidth: 1, marginBottom: 12 },
});
