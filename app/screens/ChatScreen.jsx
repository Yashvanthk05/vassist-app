import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  SafeAreaView,
  StatusBar
} from 'react-native';
import {
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithCredential,
  signInWithPopup,
  signInWithRedirect
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  query,
  onSnapshot,
  addDoc,
  serverTimestamp,
  orderBy
} from 'firebase/firestore';
import { format, isToday, isYesterday } from 'date-fns';
import {db,auth,provider} from '../../firebaseConfig';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';

WebBrowser.maybeCompleteAuthSession();

const LoginScreen = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: "145341285063-73ns4qgmnhko6lds104e722723pvseo6.apps.googleusercontent.com",
    androidClientId: "145341285063-73ns4qgmnhko6lds104e722723pvseo6.apps.googleusercontent.com",
  });

  useEffect(() => {
    if (response?.type === "success") {
      setLoading(true);
      const { id_token } = response.params;
      const credential = GoogleAuthProvider.credential(id_token);
      signInWithCredential(auth, credential)
        .then((userCredential) => setUser(userCredential.user))
        .catch((error) => {
          console.error("Sign-In Error:", error);
          Alert.alert("Sign-In Error", error.message);
        })
        .finally(() => setLoading(false));
    }
  }, [response]);

  const handleGoogleSignIn = () => {
    promptAsync();
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error("Sign Out Error:", error);
      Alert.alert("Sign Out Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.authContainer}>
      <StatusBar barStyle="light-content" />
      <View style={styles.authForm}>
        {user ? (
          <View>
            <Text>Welcome, {user.displayName || user.email}</Text>
            <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut} disabled={loading}>
              <Text style={styles.signOutButtonText}>Sign out</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.authButton} onPress={handleGoogleSignIn} disabled={loading || !request}>
            <Text style={styles.authButtonText}>Sign in with Google</Text>
          </TouchableOpacity>
        )}
        {loading && <ActivityIndicator size="large" color="#0000ff" />}
      </View>
    </SafeAreaView>
  );
};

const Forum = ({ user, onSignOut }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef();

  useEffect(() => {
    const q = query(
      collection(db, 'messages'),
      orderBy('timestamp', 'asc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedMessages = snapshot.docs.map((doc) => {
        const data = doc.data();
        const timestamp = data.timestamp?.toDate?.() || new Date();
        
        return {
          id: doc.id,
          ...data,
          timestamp
        };
      });
      setMessages(fetchedMessages);
      
      if (fetchedMessages.length > 0) {
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    });

    return () => unsubscribe();
  }, []);

  const sendMessage = async () => {
    if (!newMessage.trim() || isLoading) return;

    try {
      setIsLoading(true);
      
      await addDoc(collection(db, 'messages'), {
        text: newMessage,
        user: user.email,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.email)}`,
        timestamp: serverTimestamp(),
      });

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return 'Sending...';
    try {
      return format(timestamp, 'hh:mm a');
    } catch (error) {
      return 'Invalid time';
    }
  };

  const renderDateHeader = (date) => (
    <View style={styles.dateHeaderContainer}>
      <View style={styles.dateHeaderLine} />
      <Text style={styles.dateHeaderText}>{date}</Text>
      <View style={styles.dateHeaderLine} />
    </View>
  );

  const renderItem = ({ item, index }) => {
    let showDateHeader = false;
    if (index === 0) {
      showDateHeader = true;
    } else {
      const prevItem = messages[index - 1];
      const prevDate = isToday(prevItem.timestamp)
        ? 'Today'
        : isYesterday(prevItem.timestamp)
        ? 'Yesterday'
        : format(prevItem.timestamp, 'MMMM dd, yyyy');
      
      const currentDate = isToday(item.timestamp)
        ? 'Today'
        : isYesterday(item.timestamp)
        ? 'Yesterday'
        : format(item.timestamp, 'MMMM dd, yyyy');
      
      if (prevDate !== currentDate) {
        showDateHeader = true;
      }
    }
    const isCurrentUser = "";
    const dateToShow = isToday(item.timestamp)
      ? 'Today'
      : isYesterday(item.timestamp)
      ? 'Yesterday'
      : format(item.timestamp, 'MMMM dd, yyyy');

    return (
      <>
        {showDateHeader && renderDateHeader(dateToShow)}
        <View style={[
          styles.messageRow,
          isCurrentUser ? styles.currentUserMessageRow : styles.otherUserMessageRow
        ]}>
          {!isCurrentUser && (
            <Image
              source={{ uri: item.avatar }}
              style={styles.avatar}
            />
          )}
          <View style={[
            styles.messageBubble,
            isCurrentUser ? styles.currentUserBubble : styles.otherUserBubble
          ]}>
            <Text style={styles.messageSender}>
              {isCurrentUser ? 'You' : item.user}
            </Text>
            <Text style={styles.messageText}>{item.text}</Text>
            <Text style={styles.messageTime}>
              {formatTime(item.timestamp)}
            </Text>
          </View>
          {isCurrentUser && (
            <Image
              source={{ uri: item.avatar }}
              style={styles.avatar}
            />
          )}
        </View>
      </>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Forum</Text>
        <TouchableOpacity style={styles.signOutButton} onPress={onSignOut}>
          <Text style={styles.signOutButtonText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.messagesContainer}>
        {messages.length > 0 ? (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.flatListContent}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No messages yet. Start the conversation!</Text>
          </View>
        )}
      </View>
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        style={styles.inputContainer}
      >
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Type your message here..."
            placeholderTextColor="#666"
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
          />
          {newMessage.length > 0 && (
            <Text style={styles.charCount}>
              {newMessage.length} {newMessage.length === 1 ? 'char' : 'chars'}
            </Text>
          )}
        </View>
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!newMessage.trim() || isLoading) && styles.disabledButton
          ]}
          onPress={sendMessage}
          disabled={!newMessage.trim() || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.sendButtonText}>Send</Text>
          )}
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const ChatScreen = () => {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (initializing) setInitializing(false);
    });

    return () => unsubscribe();
  }, [initializing]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (initializing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {user ? (
        <Forum user={user} onSignOut={handleSignOut} />
      ) : (
        <Forum onLogin={() => {}} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    backgroundColor: '#1a1a1a',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  signOutButton: {
    backgroundColor: '#333',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  signOutButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: '#121212',
  },
  flatListContent: {
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
  },
  messageRow: {
    flexDirection: 'row',
    marginVertical: 8,
    alignItems: 'flex-end',
  },
  currentUserMessageRow: {
    justifyContent: 'flex-end',
  },
  otherUserMessageRow: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginHorizontal: 8,
  },
  messageBubble: {
    maxWidth: '70%',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 2,
  },
  currentUserBubble: {
    backgroundColor: '#3b82f6',
    borderBottomRightRadius: 4,
  },
  otherUserBubble: {
    backgroundColor: '#333',
    borderBottomLeftRadius: 4,
  },
  messageSender: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  messageText: {
    fontSize: 14,
    color: '#fff',
  },
  messageTime: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.6)',
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#333',
    backgroundColor: '#1a1a1a',
  },
  inputWrapper: {
    flex: 1,
    position: 'relative',
  },
  input: {
    backgroundColor: '#333',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingRight: 40,
    color: '#fff',
    fontSize: 14,
    minHeight: 40,
    maxHeight: 120,
  },
  charCount: {
    position: 'absolute',
    bottom: 8,
    right: 12,
    fontSize: 10,
    color: '#666',
  },
  sendButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 20,
    width: 60,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#333',
    opacity: 0.7,
  },
  dateHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dateHeaderLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#333',
  },
  dateHeaderText: {
    color: '#888',
    fontSize: 12,
    marginHorizontal: 10,
  },
  authContainer: {
    flex: 1,
    backgroundColor: '#121212',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  authForm: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  authTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  authSubtitle: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 20,
    textAlign: 'center',
  },
  authInput: {
    backgroundColor: '#333',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    color: '#fff',
  },
  authButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  authButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  switchAuthMode: {
    alignItems: 'center',
  },
  switchAuthText: {
    color: '#3b82f6',
    fontSize: 14,
  },
  errorText: {
    color: '#f87171',
    marginBottom: 16,
    textAlign: 'center',
  }
});

export default ChatScreen;