// sign up screen
import React, { useState } from 'react';
import { 
  View, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  StyleSheet, 
  Text, 
  ImageBackground 
} from 'react-native';
import { auth, db } from '../config/Firebaseconfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

export default function SignUpScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // function to update active user in Firestore.
  async function updateActiveUser(uid) {
    try {
      await setDoc(doc(db, 'settings', 'currentUser'), { uid });
      console.log('Active user updated to:', uid);
    } catch (error) {
      console.error('Error updating active user:', error);
    }
  }

  const handleSignUp = async () => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // update Firestore with the new user's UID.
      await updateActiveUser(user.uid);
      
      // navigate to eye-lid selection for new users.
      navigation.replace('Threshold');
    } catch (error) {
      Alert.alert('Sign Up Error', error.message);
    }
  };

  return (
    <ImageBackground
      source={require('../assets/1.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.container}>
        <Text style={styles.title}>Create a New Account</Text>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#ccc"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          selectionColor="black"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#ccc"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          selectionColor="black"
        />
        <TouchableOpacity style={styles.signUpButton} onPress={handleSignUp}>
          <Text style={styles.signUpButtonText}>Sign Up</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.altButton} onPress={() => navigation.goBack()}>
          <Text style={styles.altButtonText}>Already have an account? Login</Text>
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
    marginTop: -60
  },
  title: {
    fontSize: 20,
    marginBottom: 20,
    textAlign: 'center',
    color: '#fff'
  },
  input: {
    height: 40,
    width: '100%',
    borderColor: '',
    borderWidth: 1,
    marginBottom: 10,
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.27)',
    color: 'white'
  },
  signUpButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.27)', // button color
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 25,
    marginBottom: 15,
    alignItems: 'center',
    width: '100%'
  },
  signUpButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  altButton: {
    marginTop: 10,
    alignItems: 'center'
  },
  altButtonText: {
    color: '#fff',
    fontSize: 14,
    textDecorationLine: 'underline'
  }
});