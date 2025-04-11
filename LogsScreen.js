// real time logs
import React, { useState, useEffect, useContext } from 'react';
import { FlatList, View, Text, StyleSheet, ImageBackground } from 'react-native';
import { collection, query, onSnapshot, orderBy, where } from 'firebase/firestore';
import { db } from '../config/Firebaseconfig';
import { AuthContext } from '../AuthContext';

export default function LogsScreen() {
  const [alerts, setAlerts] = useState([]);
  const user = useContext(AuthContext);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'alerts'),
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAlerts(data);
    }, error => {
      console.error("Firestore error:", error);
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <ImageBackground
      source={require('../assets/4.png')} // background image
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.container}>
        <FlatList
          data={alerts}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View style={styles.logItem}>
              <Text style={styles.timestamp}>
                {item.timestamp?.toDate().toLocaleString() || 'Unknown time'}
              </Text>
              <Text style={styles.type}>
                {item.type?.toUpperCase() || 'UNKNOWN EVENT'}
              </Text>
              <Text style={styles.severity}>
                Severity: {item.severity?.toFixed(2) || 'N/A'}
              </Text>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>No alerts recorded yet</Text>
          }
        />
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1
  },
  container: { flex: 1, padding: 15, backgroundColor: 'rgba(0, 0, 0, 0)' },
  logItem: {
    backgroundColor: 'rgba(0, 0, 0, 0.31)',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    elevation: 2,
  },
  timestamp: { fontSize: 12, color: 'rgba(255, 255, 255, 0.87)' },
  type: { fontSize: 16, fontWeight: '600', marginVertical: 4, color: 'rgb(255, 255, 255)' },
  severity: { fontSize: 14, color: 'rgb(255, 255, 255)' },
  empty: { textAlign: 'center', marginTop: 20, color: '#adb5bd' },
});
