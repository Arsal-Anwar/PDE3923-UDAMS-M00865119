// login screen
import React, { useState } from 'react';
import { 
  View, 
  TextInput, 
  Alert, 
  StyleSheet, 
  ImageBackground, 
  TouchableOpacity,
  Text
} from 'react-native';
import { auth, db } from '../config/Firebaseconfig';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

export default function LoginScreen({ navigation }) {
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

  const handleLogin = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // update active user document in Firestore.
      await updateActiveUser(user.uid);
    } catch (error) {
      Alert.alert('Login Error', error.message);
    }
  };

  return (
    <ImageBackground
      source={require('../assets/7.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.container}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="rgb(255, 255, 255)"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="rgb(255, 255, 255)"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        {/* Login Button */}
        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
          <Text style={styles.loginButtonText}>Login</Text>
        </TouchableOpacity>
        {/* Account Button */}
        <TouchableOpacity style={styles.createAccountButton} onPress={() => navigation.navigate('SignUp')}>
          <Text style={styles.createAccountButtonText}>Create Account</Text>
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
    justifyContent: 'center'
  },
  input: {
    height: 40,
    borderColor: '',
    borderWidth: 1,
    marginBottom: 10,
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.27)', 
    color: 'white'
  },
  loginButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.27)',  // button color
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 25,
    marginBottom: 15,
    alignItems: 'center',
    width: '100%'
  },
  loginButtonText: {
    color: '#fff',  
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  createAccountButton: {
    paddingVertical: 4,
    paddingHorizontal: 25,
    borderRadius: 25,
    marginBottom: 15,
    alignItems: 'center',
    width: '100%',
    backgroundColor: 'transparent'
  },
  createAccountButtonText: {
    color: '#fff',
    fontSize: 16,
    textDecorationLine: 'underline',
    textAlign: 'center'
  }
});