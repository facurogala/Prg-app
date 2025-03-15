import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, FlatList } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const App: React.FC = () => {
  // Estados para los inputs y el 1RM
  const [weight, setWeight] = useState<string>('');
  const [reps, setReps] = useState<string>('');
  const [oneRepMax, setOneRepMax] = useState<number | null>(null);

  // Función para calcular el 1RM
  const calculateOneRepMax = (weight: string, reps: string) => {
    const weightNum = parseFloat(weight);
    const repsNum = parseFloat(reps);

    if (!isNaN(weightNum) && !isNaN(repsNum) && repsNum > 0) {
      // Fórmula de Epley
      const oneRM = weightNum * (1 + 0.0333 * repsNum);
      return Math.round(oneRM); // Redondear al entero más cercano
    } else {
      return null;
    }
  };

  // Función para calcular los RM del 1 al 20
  const calculateRMs = () => {
    if (!oneRepMax) return [];

    const rms = [];
    // Agregar el 1RM como el primer elemento
    rms.push({ reps: 1, weight: oneRepMax });

    // Calcular los RM subsiguientes (2RM a 20RM)
    for (let i = 2; i <= 20; i++) {
      // Fórmula inversa de Epley
      const rm = oneRepMax / (1 + 0.0333 * i);
      rms.push({ reps: i, weight: Math.round(rm) }); // Redondear al entero más cercano
    }
    return rms;
  };

  // Renderizar cada item de la cuadrícula
  const renderItem = ({ item }: { item: { reps: number; weight: number } }) => (
    <View style={styles.gradientBox}>
      <LinearGradient
        colors={['#737373', '#272729']}
        start={{ x: 0, y: -1 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradientBackground}
      >
        <View style={styles.rmItem}>
          <Text style={styles.rmRepsText}>{item.reps} RM</Text>
          <Text style={styles.rmWeightText}>{item.weight} kg</Text>
        </View>
      </LinearGradient>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Inputs para peso y repeticiones */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Kilos"
          placeholderTextColor="#999"
          keyboardType="numeric"
          value={weight}
          onChangeText={(text) => {
            setWeight(text);
            setOneRepMax(calculateOneRepMax(text, reps));
          }}
        />
        <View style={styles.divider} />
        <TextInput
          style={styles.input}
          placeholder="Repes"
          placeholderTextColor="#999"
          keyboardType="numeric"
          value={reps}
          onChangeText={(text) => {
            setReps(text);
            setOneRepMax(calculateOneRepMax(weight, text));
          }}
        />
      </View>

      {/* Cuadrícula de RM */}
      <FlatList
        data={calculateRMs()}
        renderItem={renderItem}
        keyExtractor={(item) => item.reps.toString()}
        numColumns={4} // 4 columnas
        contentContainerStyle={styles.rmGrid}
      />
    </View>
  );
};

// Estilos
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: '#161616',
  },
  inputContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#272729',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#272729',
    marginTop: 10,
  },
  input: {
    flex: 1,
    padding: 15,
    fontSize: 16,
    color: '#fff',
  },
  divider: {
    width: 1,
    backgroundColor: '#444',
  },
  rmGrid: {
    marginTop: 10,
  },
  gradientBox: {
    flex: 1,
    margin: 5,
    aspectRatio: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  gradientBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rmItem: {
    width: '96%',
    height: '96%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#272729',
    borderRadius: 14,
  },
  rmRepsText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  rmWeightText: {
    fontSize: 14,
    color: '#fff',
  },
});

export default App;