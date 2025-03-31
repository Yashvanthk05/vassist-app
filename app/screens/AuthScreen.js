import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { auth, provider, signInWithPopup } from "../../firebaseConfig";
import { signOut } from "firebase/auth";

const AuthScreen = ({ navigation }) => {
    const [loading, setLoading] = useState(false);

    const signIn = async () => {
        setLoading(true);
        try {
            await signInWithPopup(auth, provider);
            navigation.replace("Forum");
        } catch (error) {
            console.error("Login Error:", error);
        }
        setLoading(false);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Welcome to the Discussion Forum</Text>
            {loading ? (
                <ActivityIndicator size="large" color="#0a84ff" />
            ) : (
                <TouchableOpacity style={styles.button} onPress={signIn}>
                    <Text style={styles.buttonText}>Sign in with Google</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#121212",
    },
    title: {
        fontSize: 22,
        color: "white",
        marginBottom: 20,
    },
    button: {
        backgroundColor: "#0a84ff",
        padding: 15,
        borderRadius: 8,
    },
    buttonText: {
        color: "white",
        fontSize: 16,
    },
});

export default AuthScreen;
