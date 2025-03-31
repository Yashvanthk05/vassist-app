import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, FlatList, Alert, Linking } from 'react-native';
import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';

// Keep API key in code for debugging (move to env later)
const GOOGLE_DRIVE_API_KEY = "AIzaSyAuItmFqEklJP21-qGk1TyS87XlSORhMmI";
const ROOT_FOLDER_ID = "17J2Qw3xEwzXKvzFp6r_avWsVxXuewA5x";

const PYQScreen = () => {
  const [items, setItems] = useState([]);
  const [path, setPath] = useState(ROOT_FOLDER_ID);
  const [parentPaths, setParentPaths] = useState([ROOT_FOLDER_ID]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const searchInputRef = useRef(null);

  useEffect(() => {
    fetchContent(path);
  }, [path]);

  const fetchContent = async (folderId) => {
    setIsLoading(true);

    const apiUrl = `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents&key=${GOOGLE_DRIVE_API_KEY}`;
    console.log('Fetching from:', apiUrl);

    try {
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      setItems(data.files || []);
    } catch (error) {
      Alert.alert("Error", `Failed to load files: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getPdfViewLink = (fileId) => `https://drive.google.com/file/d/${fileId}/preview`;

  const handleOpenFile = (fileId) => {
    const url = getPdfViewLink(fileId);
    Linking.openURL(url).catch(() => Alert.alert("Error", "Unable to open file."));
  };

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#121212', padding: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e1e1e', padding: 10, borderRadius: 8 }}>
        <FontAwesome name="search" size={20} color="#bbb" />
        <TextInput
          placeholder="Search by Subject Name/Code"
          placeholderTextColor="#bbb"
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={{ flex: 1, marginLeft: 10, color: 'white' }}
          ref={searchInputRef}
        />
      </View>

      {parentPaths.length > 1 && (
        <TouchableOpacity
          onPress={() => {
            const newPaths = [...parentPaths];
            newPaths.pop();
            setPath(newPaths[newPaths.length - 1]);
            setParentPaths(newPaths);
          }}
          style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}
        >
          <FontAwesome name="arrow-left" size={20} color="white" />
          <Text style={{ color: 'white', marginLeft: 5 }}>Go Back</Text>
        </TouchableOpacity>
      )}

      {isLoading ? (
        <ActivityIndicator size="large" color="#0a7ea4" style={{ marginTop: 20 }} />
      ) : filteredItems.length === 0 ? (
        <Text style={{ color: '#bbb', textAlign: 'center', marginTop: 20 }}>No files found in this folder</Text>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ marginTop: 10 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() =>
                item.mimeType === "application/vnd.google-apps.folder"
                  ? (setParentPaths([...parentPaths, item.id]), setPath(item.id))
                  : handleOpenFile(item.id)
              }
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#1e1e1e',
                padding: 12,
                borderRadius: 8,
                marginBottom: 10,
              }}
            >
              {item.mimeType === "application/vnd.google-apps.folder" ? (
                <MaterialCommunityIcons name="folder" size={32} color="#facc15" />
              ) : (
                <MaterialCommunityIcons name="file-pdf-box" size={32} color="#ff5252" />
              )}
              <Text style={{ color: 'white', marginLeft: 10, flex: 1 }}>
                {item.name.length > 25 ? `${item.name.slice(0, 25)}...` : item.name}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
};

export default PYQScreen;
