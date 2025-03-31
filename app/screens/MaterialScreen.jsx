import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, TextInput } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';

const GOOGLE_DRIVE_API_KEY = "AIzaSyAuItmFqEklJP21-qGk1TyS87XlSORhMmI";
const ROOT_FOLDER_ID = "1Z4tBts_Y55n4m8yRSyV7WzKocVHpi9yC";

const MaterialScreen = () => {
    const [materials, setMaterials] = useState([]);
    const [filteredMaterials, setFilteredMaterials] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchText, setSearchText] = useState("");
    const [currentFolderId, setCurrentFolderId] = useState(ROOT_FOLDER_ID);
    const [folderHistory, setFolderHistory] = useState([]);

    useEffect(() => {
        fetchMaterials(currentFolderId);
    }, [currentFolderId]);

    const fetchMaterials = async (folderId) => {
        setIsLoading(true);
        setError(null);

        const apiUrl = `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents&key=${GOOGLE_DRIVE_API_KEY}`;

        try {
            const response = await fetch(apiUrl);
            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }

            const data = await response.json();
            if (data.files) {
                setMaterials(data.files);
                setFilteredMaterials(data.files);
            } else {
                setMaterials([]);
                setFilteredMaterials([]);
            }
        } catch (error) {
            setError(`Failed to load files: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = (text) => {
        setSearchText(text);
        if (text === "") {
            setFilteredMaterials(materials);
        } else {
            setFilteredMaterials(
                materials.filter(item => item.name.toLowerCase().includes(text.toLowerCase()))
            );
        }
    };

    const handleItemPress = (item) => {
        if (item.mimeType === 'application/vnd.google-apps.folder') {
            setFolderHistory([...folderHistory, currentFolderId]);
            setCurrentFolderId(item.id);
        } else {
            WebBrowser.openBrowserAsync(`https://drive.google.com/file/d/${item.id}/view`);
        }
    };

    const goBack = () => {
        if (folderHistory.length > 0) {
            const previousFolderId = folderHistory.pop();
            setFolderHistory([...folderHistory]);
            setCurrentFolderId(previousFolderId);
        }
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity style={styles.item} onPress={() => handleItemPress(item)}>
            <MaterialIcons 
                name={item.mimeType === 'application/vnd.google-apps.folder' ? "folder" : "insert-drive-file"} 
                size={30} 
                color={item.mimeType === 'application/vnd.google-apps.folder' ? "#facc15" : "#4caf50"} 
                style={styles.icon}
            />
            <Text style={styles.itemName} numberOfLines={1} ellipsizeMode="tail">{item.name}</Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <TextInput
                style={styles.searchBar}
                placeholder="Search files..."
                placeholderTextColor="#bbb"
                value={searchText}
                onChangeText={handleSearch}
            />
            {folderHistory.length > 0 && (
                <TouchableOpacity style={styles.backButton} onPress={goBack}>
                    <MaterialIcons name="arrow-back" size={24} color="white" />
                    <Text style={styles.backText}>Back</Text>
                </TouchableOpacity>
            )}
            {isLoading ? (
                <ActivityIndicator size="large" color="white" />
            ) : error ? (
                <Text style={styles.error}>{error}</Text>
            ) : (
                <FlatList
                    data={filteredMaterials}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212',
        padding: 16,
    },
    searchBar: {
        height: 40,
        backgroundColor: '#1e1e1e',
        borderRadius: 8,
        paddingHorizontal: 10,
        marginBottom: 10,
        color: 'white',
        borderWidth: 1,
        borderColor: '#333',
    },
    list: {
        paddingBottom: 20,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#1e1e1e',
        borderRadius: 8,
        marginVertical: 5,
        marginHorizontal: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    icon: {
        marginRight: 15,
    },
    itemName: {
        flex: 1,
        fontSize: 16,
        color: '#fff',
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderRadius: 5,
        alignSelf: 'flex-start',
        marginBottom: 10,
    },
    backText: {
        color: 'white',
        marginLeft: 5,
        fontSize: 16,
    },
    error: {
        color: 'red',
        textAlign: 'center',
        marginTop: 20,
    },
});

export default MaterialScreen;
