import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, ScrollView, Pressable, Modal, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFormulas } from '../../contexts/FormulaContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Save } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

type Formula = {
  name: string;
  calculate: (weight: number, reps: number) => number;
};

export type LiftType = 'squat' | 'bench' | 'deadlift';

const formulas: { [key: string]: Formula } = {
  lander: {
    name: 'Lander',
    calculate: (w, r) => r === 1 ? w : (100 * w) / (101.3 - 2.67123 * r),
  },
  oconner: {
    name: "O'Conner",
    calculate: (w, r) => r === 1 ? w : w * (1 + 0.025 * r),
  },
  lombardi: {
    name: 'Lombardi',
    calculate: (w, r) => r === 1 ? w : w * Math.pow(r, 0.1),
  },
  mayhem: {
    name: 'Mayhem',
    calculate: (w, r) => r === 1 ? w : w * (1 + 0.033 * r),
  },
  wathen: {
    name: 'Wathen',
    calculate: (w, r) => r === 1 ? w : (100 * w) / (48.8 + 53.8 * Math.exp(-0.075 * r)),
  },
  brzycki: {
    name: 'Brzycki',
    calculate: (w, r) => r === 1 ? w : w * (36 / (37 - r)),
  },
  epley: {
    name: 'Epley',
    calculate: (w, r) => r === 1 ? w : w * (1 + 0.0333 * r),
  },
};

const GradientBox = ({ children, color }: { children: React.ReactNode; color: string }) => (
  <View style={styles.gradientWrapper}>
    <LinearGradient
      colors={[`${color}30`, '#52525210']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradientBorder}
    />
    <View style={styles.gradientContent}>
      {children}
    </View>
  </View>
);

export default function Calculator() {
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [rpe, setRpe] = useState('');
  const [rmValues, setRmValues] = useState<number[] | null[]>(Array.from({ length: 20 }, () => null));
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'selecting'>('idle');
  const [showLiftModal, setShowLiftModal] = useState(false);
  const [selectedLift, setSelectedLift] = useState<LiftType>('squat');
  const { selectedFormulas } = useFormulas();

  const handleWeightChange = (text: string) => {
    const numericValue = text.replace(/[^0-9]/g, '');
    if (numericValue.length <= 3) {
      setWeight(numericValue);
      setSaveStatus('idle');
    }
  };

  const handleRepsChange = (text: string) => {
    const numericValue = text.replace(/[^0-9]/g, '');
    if (numericValue.length <= 3) {
      setReps(numericValue);
      setSaveStatus('idle');
    }
  };

  const handleRPEChange = (text: string) => {
    const numericValue = text.replace(/[^0-9]/g, '');
    if (numericValue) {
      const value = parseInt(numericValue, 10);
      if (value >= 1 && value <= 10) {
        setRpe(numericValue);
      }
    } else {
      setRpe('');
    }
    setSaveStatus('idle');
  };

  const calculateOneRM = (w: number, r: number) => {
    if (r === 1) return w;
    
    const oneRMs = selectedFormulas.map(formulaId => 
      formulas[formulaId].calculate(w, r)
    );
    return oneRMs.reduce((a, b) => a + b, 0) / oneRMs.length;
  };

  const handleSavePress = () => {
    if (!weight || !reps || rmValues.length === 0) return;
    setShowLiftModal(true);
    setSaveStatus('selecting');
  };

  const confirmSaveCalculation = async (liftType: LiftType) => {
    try {
      setSaveStatus('saving');
      setSelectedLift(liftType);
      setShowLiftModal(false);
      
      const numericRpe = rpe && !isNaN(Number(rpe)) ? Number(rpe) : undefined;

      const newEntry = {
        date: new Date().toLocaleString(),
        weight: parseFloat(weight),
        reps: parseFloat(reps),
        oneRM: rmValues[0] || parseFloat(weight),
        rpe: numericRpe,
        liftType: liftType,
        id: Date.now().toString(),
      };

      const existingHistory = await AsyncStorage.getItem('calculationHistory');
      const history = existingHistory ? JSON.parse(existingHistory) : [];
      history.push(newEntry);
      await AsyncStorage.setItem('calculationHistory', JSON.stringify(history));

      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Error saving calculation:', error);
      setSaveStatus('idle');
    }
  };

  useEffect(() => {
    if (weight && reps) {
      const w = parseFloat(weight);
      const r = parseFloat(reps);

      if (!isNaN(w) && !isNaN(r)) {
        if (r === 1) {
          const newRmValues = Array.from({ length: 20 }, (_, i) => {
            if (i === 0) return w;
            const repFactor = 1 - (i * 0.025);
            return w * repFactor;
          });
          setRmValues(newRmValues);
        } else {
          const avgOneRM = calculateOneRM(w, r);
          const newRmValues = Array.from({ length: 20 }, (_, i) => {
            const repFactor = 1 - (i * 0.025);
            return avgOneRM * repFactor;
          });
          setRmValues(newRmValues);
        }
      }
    } else {
      setRmValues(Array.from({ length: 20 }, () => null));
    }
  }, [weight, reps, selectedFormulas]);

  const rows = [];
  for (let i = 0; i < 20; i += 4) {
    rows.push(rmValues.slice(i, i + 4));
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Text style={styles.title}>1RM Calculator</Text>

        <BlurView intensity={20} tint="dark" style={styles.card}>
          <View style={styles.inputRow}>
            <View style={[styles.inputWrapper, { flex: 2 }]}>
              <Text style={styles.label}>Weight (kg)</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={weight}
                  onChangeText={handleWeightChange}
                  keyboardType="numeric"
                  maxLength={3}
                  placeholderTextColor="#666"
                  placeholder="Weight"
                />
              </View>
            </View>
            <View style={[styles.inputWrapper, { flex: 1 }]}>
              <Text style={styles.label}>Reps</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={reps}
                  onChangeText={handleRepsChange}
                  keyboardType="numeric"
                  maxLength={2}
                  placeholderTextColor="#666"
                  placeholder="Reps"
                />
              </View>
            </View>
            <View style={[styles.inputWrapper, { flex: 1 }]}>
              <Text style={styles.label}>RPE</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={rpe}
                  onChangeText={handleRPEChange}
                  keyboardType="numeric"
                  maxLength={2}
                  placeholderTextColor="#666"
                  placeholder="1-10"
                />
              </View>
            </View>
          </View>

          {rmValues.length > 0 && (
            <Pressable
              onPress={handleSavePress}
              style={({ pressed }) => [
                styles.saveButton,
                saveStatus === 'saved' && styles.saveButtonSuccess,
                pressed && styles.saveButtonPressed
              ]}>
              <LinearGradient
                colors={saveStatus === 'saved' ? ['#525252', '#525252'] : ['#1a1a1a', '#1a1a1a']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.saveButtonGradient}>
                <View style={styles.saveButtonContent}>
                  <Save
                    size={18}
                    color={saveStatus === 'saved' ? '#B8B8B8' : '#525252'}
                    style={styles.saveButtonIcon}
                  />
                  <Text style={[
                    styles.saveButtonText,
                    saveStatus === 'saved' && styles.saveButtonTextSuccess
                  ]}>
                    {saveStatus === 'saving' ? 'Saving...' :
                      saveStatus === 'saved' ? 'Saved!' :
                        'Save Calculation'}
                  </Text>
                </View>
              </LinearGradient>
            </Pressable>
          )}
        </BlurView>

        <Text style={styles.sectionTitle}>Repetition Maximums</Text>
        <BlurView intensity={20} tint="dark" style={styles.card}>
          {rows.map((row, rowIndex) => (
            <View key={rowIndex} style={[
              styles.rmRow,
              rowIndex < rows.length - 1 && styles.rmRowBorder
            ]}>
              {row.map((value, colIndex) => {
                const rmNumber = rowIndex * 4 + colIndex + 1;
                const percentage = 100 - ((rmNumber - 1) * 2.5);
                return (
                  <GradientBox key={rowIndex * 4 + colIndex} color="#B8B8B8">
                    <Text style={styles.rmNumber}>{rmNumber}RM</Text>
                    <Text style={styles.rmValue}>
                      {value ? Math.round(value) : '--'}
                    </Text>
                    <Text style={styles.rmPercentage}>
                      {value ? `${percentage}%` : '--%'}
                    </Text>
                  </GradientBox>
                );
              })}
            </View>
          ))}
        </BlurView>
      </ScrollView>

      {/* Modal para seleccionar tipo de levantamiento */}
      <Modal
        visible={showLiftModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setShowLiftModal(false);
          setSaveStatus('idle');
        }}>
        <View style={styles.modalOverlay}>
          <BlurView intensity={20} tint="dark" style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Lift Type</Text>
            
            {(['squat', 'bench', 'deadlift'] as LiftType[]).map((lift) => (
              <TouchableOpacity
                key={lift}
                style={styles.modalOption}
                onPress={() => confirmSaveCalculation(lift)}>
                <Text style={styles.modalOptionText}>
                  {lift.charAt(0).toUpperCase() + lift.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
            
            <TouchableOpacity
              style={styles.modalCancel}
              onPress={() => {
                setShowLiftModal(false);
                setSaveStatus('idle');
              }}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </BlurView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111111',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#B8B8B8',
    marginBottom: 24,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#B8B8B8',
    marginTop: 24,
    marginBottom: 16,
  },
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    padding: 16,
    backgroundColor: 'rgba(20, 20, 20, 0.8)',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  inputWrapper: {
    flex: 1,
  },
  label: {
    color: '#B8B8B8',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#525252',
  },
  input: {
    color: '#B8B8B8',
    padding: 10,
    fontSize: 16,
    textAlign: 'center',
  },
  rmRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  rmRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#525252',
  },
  gradientWrapper: {
    width: '23%',
    position: 'relative',
  },
  gradientBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 12,
  },
  gradientContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 8,
    margin: 1,
    textAlign: 'center',
  },
  rmNumber: {
    color: '#DBFF00',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
    textAlign: 'center',
  },
  rmValue: {
    color: '#B8B8B8',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
    textAlign: 'center',
  },
  rmPercentage: {
    color: '#525252',
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
  saveButton: {
    marginTop: 24,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  saveButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  saveButtonSuccess: {
    elevation: 0,
    shadowOpacity: 0,
  },
  saveButtonGradient: {
    flex: 1,
    padding: 1,
  },
  saveButtonContent: {
    flex: 1,
    flexDirection: 'row',
    textAlign: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveButtonIcon: {
    marginRight: 4,
  },
  saveButtonText: {
    color: '#525252',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  saveButtonTextSuccess: {
    color: '#B8B8B8',
  },
  // Estilos para el modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 20,
  },
  modalContent: {
    width: '80%',
    borderRadius: 20,
    padding: 20,
    backgroundColor: 'rgba(30, 30, 30, 0.9)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#B8B8B8',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalOption: {
    padding: 15,
    borderRadius: 12,
    backgroundColor: '#1a1a1a',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#525252',
  },
  modalOptionText: {
    color: '#B8B8B8',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  modalCancel: {
    marginTop: 10,
    padding: 15,
    borderRadius: 12,
  },
  modalCancelText: {
    color: '#DBFF00',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
});