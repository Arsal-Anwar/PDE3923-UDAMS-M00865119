// home screen
import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ImageBackground } from 'react-native';
import { signOut } from 'firebase/auth';
import { doc, deleteDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/Firebaseconfig';

export default function HomeScreen({ navigation }) {
  // force navigation to Threshold if not set
  useEffect(() => {
    async function checkThreshold() {
      try {
        const user = auth.currentUser;
        if (user) {
          const userDocRef = doc(db, 'users', user.uid);
          const snap = await getDoc(userDocRef);
          // force navigation to Threshold screen
          if (!snap.exists() || snap.data().threshold === undefined || snap.data().threshold === null) {
            console.log("No threshold set for user. Navigating to Threshold screen.");
            navigation.replace('Threshold');
          }
        }
      } catch (error) {
        console.error("Error checking threshold:", error);
      }
    }
    checkThreshold();
  }, [navigation]);

  async function handleSignOut() {
    try {
      await deleteDoc(doc(db, 'settings', 'currentUser'));
      console.log('Active user document cleared in Firestore.');
      await signOut(auth);
      console.log('User signed out from Firebase Auth.');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }

  return (
    <ImageBackground
      source={require('../assets/2.png')}  // background image
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('Threshold')}
        >
          <Text style={styles.buttonText}>Edit Eye-Lid Size</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('Logs')}
        >
          <Text style={styles.buttonText}>View Real-Time Logs</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={handleSignOut}
        >
          <Text style={styles.buttonText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1
  },
  container: { 
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: -50,
    // overlay background color
    backgroundColor: 'rgba(0, 0, 0, 0)'
  },
  button: {
    backgroundColor: 'rgba(0, 0, 0, 0.32)', // button color
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 25,
    marginVertical: 8,
    alignItems: 'center',
    width: '78%' // button width
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center'
  }
});