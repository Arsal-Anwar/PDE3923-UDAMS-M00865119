// eye-lid size page
import React, { useState, useEffect, useContext } from 'react';
import { View, Text, Button, TouchableOpacity, StyleSheet, ImageBackground } from 'react-native';
import { doc, setDoc, onSnapshot, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/Firebaseconfig';
import { AuthContext } from '../AuthContext';

export default function ThresholdScreen({ navigation }) {
  const user = useContext(AuthContext) || auth.currentUser;
  const [selectedThreshold, setSelectedThreshold] = useState(null);

  // check if threshold is already set
  useEffect(() => {
    async function checkExistingThreshold() {
      if (user) {
        const docRef = doc(db, 'users', user.uid);
        const snap = await getDoc(docRef);
        if (snap.exists() && snap.data().threshold !== undefined && snap.data().threshold !== null) {
          setSelectedThreshold(snap.data().threshold);
          console.log("Existing threshold:", snap.data().threshold);
        }
      }
    }
    checkExistingThreshold();
  }, [user]);

  // check realtime threshold updates
  useEffect(() => {
    if (user) {
      const docRef = doc(db, 'users', user.uid);
      const unsubscribe = onSnapshot(docRef, (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (data.threshold !== undefined) {
            setSelectedThreshold(data.threshold);
            console.log("Threshold from Firestore:", data.threshold);
          }
        }
      });
      return unsubscribe;
    }
  }, [user]);

  const updateThreshold = async (value) => {
    if (user) {
      try {
        console.log("Updating threshold to:", value);
        const docRef = doc(db, 'users', user.uid);
        await setDoc(docRef, { threshold: value }, { merge: true });
        setSelectedThreshold(value);
        console.log("Threshold updated to:", value);
        alert(`Threshold updated to ${value}`);
      } catch (error) {
        console.error("Error updating threshold:", error);
        alert("Error updating threshold: " + error.message);
      }
    }
  };

  // after setting eye-lid navigate to home screen
  const handleContinue = () => {
    if (selectedThreshold !== null) {
      navigation.replace('Home');
    } else {
      alert("Please select a threshold.");
    }
  };

  return (
    <ImageBackground
      source={require('../assets/5.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.container}>
        <View style={styles.buttonContainer}>
          <Button title="Small (0.15)" onPress={() => updateThreshold(0.15)} />
          <Button title="Mid (0.20)" onPress={() => updateThreshold(0.20)} />
          <Button title="Large (0.25)" onPress={() => updateThreshold(0.25)} />
        </View>
        {selectedThreshold !== null && (
          <Text style={styles.info}>Current Threshold: {selectedThreshold}</Text>
        )}
        <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
          <Text style={styles.continueButtonText}>Continue</Text>
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
    padding: 20, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0)'
  },
  title: {
    fontSize: 20,
    marginBottom: 20,
    textAlign: 'center',
    color: '#fff'
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20
  },
  info: {
    fontSize: 16,
    marginBottom: 20,
    color: '#fff'
  },
  continueButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.36)', // buton color
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
    marginVertical: 10,
    width: '60%',
    alignItems: 'center'
  },
  continueButtonText: {
    color: 'rgb(255, 255, 255)',
    fontSize: 16,
    textAlign: 'center'
  }
});
