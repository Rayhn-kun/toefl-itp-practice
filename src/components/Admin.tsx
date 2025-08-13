import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Lock, User, CheckCircle, XCircle, LogOut, Eye, EyeOff, FileText, Users, Trophy } from 'lucide-react';
import { toast } from 'sonner';
import { getQuizResults, getStudentResults } from '@/lib/supabase';
import { useQuiz } from '@/contexts/QuizContext';

// List of students in class 12.C
const CLASS_STUDENTS = [
  { name: 'AISYAH ALISSYA RAHMAH', hasCompleted: false },
  { name: 'ALLISA AULIA ZHAFIRAH', hasCompleted: false },
  { name: 'ANRI RACHMAN', hasCompleted: false },
  { name: 'ATTHALAH QINTHARA AHMAD', hasCompleted: false },
  { name: 'AZKA FACHRI NASHIRULHAQ HERMAWAN', hasCompleted: false },
  { name: 'BAGUS SETYOKO', hasCompleted: false },
  { name: 'BARIKA ZAHRA JAYUSMAN', hasCompleted: false },
  { name: 'CAHAYA MUTIARA KASIH', hasCompleted: false },
  { name: 'DAFI RAIHAN BAYU RAMADHAN', hasCompleted: false },
  { name: 'DEVHARA GUSTAF RIZKIA', hasCompleted: false },
  { name: 'FAREL ALFARIZI', hasCompleted: false },
  { name: 'HANAFI ARDIANSYAH', hasCompleted: false },
  { name: 'HIKAR ADZWA NAUFAL BHINEKA', hasCompleted: false },
  { name: 'KAYFAL MUTTAQIN', hasCompleted: false },
  { name: 'KEYLA PUTRI AZZAHRA', hasCompleted: false },
  { name: 'KHAIQAL ALFATHAN AJIJI', hasCompleted: false, isAdmin: true, isExcluded: true },
  { name: 'KIRANA MAHARDIKA', hasCompleted: false },
  { name: 'MAGNA MEYDA AHMAD', hasCompleted: false },
  { name: 'MAITSAA\' SHAFWAH RAMADHANI', hasCompleted: false },
  { name: 'MANULLANG, LUSIANA PUTRI', hasCompleted: false },
  { name: 'MOCHAMAD DZAKY ASSIDQI', hasCompleted: false },
  { name: 'MUHAMMAD DHAFIN FIRDAUS RAHMAT SUBEKTI', hasCompleted: false, isAdmin: true, isExcluded: true },
  { name: 'MUHAMMAD DHAFIN NUGRAHA', hasCompleted: false },
  { name: 'MUHAMMAD HAPIDH DAVYDENKO RUSMANA', hasCompleted: false, isAdmin: true, isExcluded: true },
  { name: 'MUHAMMAD IBRAHIM RAYNALDO NUGRAHA', hasCompleted: false },
  { name: 'MUHAMMAD MALIK SHIRAZY', hasCompleted: false },
  { name: 'MUHAMMAD RASIKH NURRAHIM', hasCompleted: false },
  { name: 'NUURIL HUDAA AL-FURQAAN', hasCompleted: false },
  { name: 'RADEN MUHAMMAD RAFI SAFWAN', hasCompleted: false, isAdmin: true, isExcluded: true },
  { name: 'RAYHAN MUAMMAR KHADAFI', hasCompleted: false, isAdmin: true, isExcluded: true },
  { name: 'RENGGA ARYA PERMANA', hasCompleted: false },
  { name: 'RIZKI CHANDRA WIJAYA PUTRA', hasCompleted: false },
  { name: 'SHIMA RATU DONITA', hasCompleted: false },
  { name: 'ZULAYKA SAFFANAH FARDILLA', hasCompleted: false },
  { name: 'NADIYAH FALISHA ANDRIYANI SANTOSA', hasCompleted: false },
];

// Function to calculate similarity between two strings
const calculateSimilarity = (str1, str2) => {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();
  
  // Check for exact match
  if (s1 === s2) return 1.0;
  
  // Check if one string contains the other
  if (s1.includes(s2) || s2.includes(s1)) {
    const ratio = Math.min(s1.length, s2.length) / Math.max(s1.length, s2.length);
    return 0.8 * ratio; // Partial match with length consideration
  }
  
  // Check for word-level similarity
  const words1 = s1.split(/\s+/);
  const words2 = s2.split(/\s+/);
  
  let matchCount = 0;
  for (const word1 of words1) {
    if (word1.length < 3) continue; // Skip very short words
    for (const word2 of words2) {
      if (word2.length < 3) continue;
      if (word1 === word2 || word1.includes(word2) || word2.includes(word1)) {
        matchCount++;
        break;
      }
    }
  }
  
  const wordSimilarity = matchCount / Math.max(words1.length, words2.length);
  return wordSimilarity * 0.6; // Word-level similarity has lower weight
};

const Admin: React.FC = () => {
  const { state, dispatch } = useQuiz();
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [quizResults, setQuizResults] = useState<any[]>([]);
  const [students, setStudents] = useState(CLASS_STUDENTS);
  const [isLoading, setIsLoading] = useState(false);
  const [showExplanations, setShowExplanations] = useState(false);
  const [questions, setQuestions] = useState<any[]>([]);
  
  // Function to fetch quiz results
  const fetchQuizResults = async () => {
    setIsLoading(true);
    try {
      const results = await getQuizResults();
      
      // Process results and match with student names
      const processedResults = results.map(result => {
        // First try exact match (case insensitive)
        let matchedStudent = students.find(
          student => student.name.toLowerCase() === result.userName.toLowerCase()
        );
        
        let confidence = 1.0; // Perfect match
        
        // If no exact match, try fuzzy matching
        if (!matchedStudent) {
          let bestMatch = null;
          let bestScore = 0;
          
          for (const student of students) {
            const similarity = calculateSimilarity(student.name, result.userName);
            if (similarity > 0.3 && similarity > bestScore) { // Threshold of 0.3
              bestScore = similarity;
              bestMatch = student;
            }
          }
          
          if (bestMatch) {
            matchedStudent = bestMatch;
            confidence = bestScore;
          }
        }
        
        // Update student completion status if matched
        if (matchedStudent) {
          const updatedStudents = students.map(student => 
            student.name === matchedStudent.name 
              ? { ...student, hasCompleted: true }
              : student
          );
          setStudents(updatedStudents);
        }
        
        return {
          ...result,
          matchedName: matchedStudent ? matchedStudent.name : null,
          confidence: confidence
        };
      });
      
      setQuizResults(processedResults);
    } catch (error) {
      console.error('Error fetching quiz results:', error);
      toast.error('Failed to fetch quiz results');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Function to load questions with explanations
  const loadQuestions = () => {
    const structureQuestions = Array.from({ length: 15 }, (_, i) => ({
      id: i + 1,
      type: 'Structure',
      explanation: getStructureExplanation(i + 1)
    }));
    
    const writtenExpressionQuestions = Array.from({ length: 15 }, (_, i) => ({
      id: i + 16,
      type: 'Written Expression',
      explanation: getWrittenExpressionExplanation(i + 16)
    }));
    
    setQuestions([...structureQuestions, ...writtenExpressionQuestions]);
  };
  
  // Get explanation for Structure questions
  const getStructureExplanation = (id: number) => {
    // Specific explanations for questions 1-5
    if (id === 1) {
      return "Pertanyaan ini menguji pemahaman tentang klausa noun (noun clause). Jawaban yang benar adalah 'what they wanted to do' karena klausa ini berfungsi sebagai objek dari kata kerja 'knew'. Struktur noun clause yang benar dimulai dengan kata tanya 'what' diikuti oleh subjek 'they', kata kerja 'wanted', dan infinitif 'to do'.";
    } else if (id === 2) {
      return "Pertanyaan ini menguji pemahaman tentang klausa adverbial (adverbial clause). Jawaban yang benar menggunakan 'Although' yang menunjukkan kontras antara dua klausa. 'Although' digunakan untuk memperkenalkan informasi yang bertentangan dengan klausa utama.";
    } else if (id === 3) {
      return "Pertanyaan ini menguji pemahaman tentang struktur paralel (parallel structure). Jawaban yang benar memastikan bahwa semua item dalam daftar memiliki bentuk gramatikal yang sama. Dalam kasus ini, semua item harus berupa kata kerja dalam bentuk gerund (-ing).";
    } else if (id === 4) {
      return "Pertanyaan ini menguji pemahaman tentang klausa relatif (relative clause). Jawaban yang benar menggunakan 'which' atau 'that' sebagai kata ganti relatif yang merujuk pada benda mati. Klausa relatif ini memberikan informasi tambahan tentang subjek kalimat.";
    } else if (id === 5) {
      return "Pertanyaan ini menguji pemahaman tentang struktur kondisional (conditional structure). Jawaban yang benar menggunakan bentuk 'if + simple past' dalam klausa kondisional, diikuti oleh 'would + verb' dalam klausa utama untuk mengekspresikan kondisi hipotetis.";
    }
    
    // General explanation for other Structure questions
    return `Pertanyaan Structure ini menguji pemahaman tentang tata bahasa dan struktur kalimat dalam bahasa Inggris. Fokus pada elemen-elemen seperti subjek-kata kerja agreement, tenses, klausa relatif, klausa noun, struktur paralel, dan bentuk kondisional. Perhatikan konteks kalimat secara keseluruhan untuk menentukan struktur yang paling tepat.`;
  };
  
  // Get explanation for Written Expression questions
  const getWrittenExpressionExplanation = (id: number) => {
    // Specific explanations for questions 16-20
    if (id === 16) {
      return "Pertanyaan ini menguji kemampuan mengidentifikasi kesalahan dalam penggunaan artikel. Kesalahan terletak pada penggunaan 'a' sebelum kata benda yang dimulai dengan bunyi vokal. Seharusnya menggunakan 'an' untuk kata benda yang dimulai dengan bunyi vokal.";
    } else if (id === 17) {
      return "Pertanyaan ini menguji kemampuan mengidentifikasi kesalahan dalam subject-verb agreement. Kesalahan terletak pada penggunaan kata kerja tunggal dengan subjek jamak. Subjek jamak harus diikuti oleh kata kerja jamak.";
    } else if (id === 18) {
      return "Pertanyaan ini menguji kemampuan mengidentifikasi kesalahan dalam penggunaan preposisi. Kesalahan terletak pada pemilihan preposisi yang tidak tepat untuk konteks kalimat. Setiap preposisi memiliki penggunaan spesifik terkait waktu, tempat, atau hubungan lainnya.";
    } else if (id === 19) {
      return "Pertanyaan ini menguji kemampuan mengidentifikasi kesalahan dalam penggunaan kata kerja bantu (auxiliary verb). Kesalahan terletak pada penggunaan kata kerja bantu yang tidak sesuai dengan tenses kalimat atau struktur pertanyaan.";
    } else if (id === 20) {
      return "Pertanyaan ini menguji kemampuan mengidentifikasi kesalahan dalam penggunaan kata sifat (adjective) vs kata keterangan (adverb). Kesalahan terletak pada penggunaan adjective untuk memodifikasi kata kerja, seharusnya menggunakan adverb.";
    }
    
    // General explanation for other Written Expression questions
    return `Pertanyaan Written Expression ini menguji kemampuan mengidentifikasi kesalahan dalam kalimat bahasa Inggris. Fokus pada kesalahan umum seperti subject-verb agreement, tenses, penggunaan artikel, preposisi, kata ganti, kata kerja bantu, dan perbedaan adjective-adverb. Perhatikan setiap bagian yang digarisbawahi dan tentukan apakah ada kesalahan gramatikal.`;
  };
  
  // Handle login
  const handleLogin = () => {
    // Simple password check - in a real app, use proper authentication
    if (password === 'admin123') {
      setIsAuthenticated(true);
      toast.success('Login successful');
      fetchQuizResults();
      loadQuestions();
    } else {
      toast.error('Invalid password');
    }
  };
  
  // Handle logout
  const handleLogout = () => {
    setIsAuthenticated(false);
    setPassword('');
    dispatch({ type: 'SET_SHOW_ADMIN', payload: false });
  };
  
  // Format confidence level for display
  const formatConfidence = (confidence: number) => {
    if (confidence >= 0.9) return 'Sangat Tinggi';
    if (confidence >= 0.7) return 'Tinggi';
    if (confidence >= 0.5) return 'Sedang';
    if (confidence >= 0.3) return 'Rendah';
    return 'Sangat Rendah';
  };
  
  // Get badge color based on confidence
  const getConfidenceBadgeColor = (confidence: number) => {
    if (confidence >= 0.9) return 'bg-green-500';
    if (confidence >= 0.7) return 'bg-green-300';
    if (confidence >= 0.5) return 'bg-yellow-500';
    if (confidence >= 0.3) return 'bg-orange-500';
    return 'bg-red-500';
  };
  
  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      {!isAuthenticated ? (
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Admin Login</CardTitle>
            <CardDescription>Enter your password to access the admin panel</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="relative w-full">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <Button onClick={handleLogin} className="w-full">
                <Lock className="mr-2 h-4 w-4" /> Login
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">Admin Panel</h1>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" /> Logout
            </Button>
          </div>
          
          <Tabs defaultValue="results">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="results">
                <Trophy className="mr-2 h-4 w-4" /> Quiz Results
              </TabsTrigger>
              <TabsTrigger value="students">
                <Users className="mr-2 h-4 w-4" /> Student List
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="results" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl font-semibold">Quiz Results</CardTitle>
                  <CardDescription>View all student quiz results</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between mb-4">
                    <Button variant="outline" onClick={fetchQuizResults} disabled={isLoading}>
                      {isLoading ? 'Loading...' : 'Refresh Results'}
                    </Button>
                    <Button variant="outline" onClick={() => setShowExplanations(!showExplanations)}>
                      <FileText className="mr-2 h-4 w-4" />
                      {showExplanations ? 'Hide Explanations' : 'Show Explanations'}
                    </Button>
                  </div>
                  
                  <ScrollArea className="h-[500px] rounded-md border">
                    <Table>
                      <TableCaption>List of all quiz results</TableCaption>
                      <TableHeader>
                        <TableRow>
                          <TableHead>No</TableHead>
                          <TableHead>Nama Input</TableHead>
                          <TableHead>Nama Asli</TableHead>
                          <TableHead>Skor</TableHead>
                          <TableHead>Structure</TableHead>
                          <TableHead>Written</TableHead>
                          <TableHead>Waktu</TableHead>
                          <TableHead>Tanggal</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {quizResults.map((result, index) => (
                          <TableRow key={index}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>{result.userName}</TableCell>
                            <TableCell>
                              {result.matchedName ? (
                                <div className="flex flex-col gap-1">
                                  <span>{result.matchedName}</span>
                                  <Badge 
                                    variant="outline"
                                    className={`text-xs ${getConfidenceBadgeColor(result.confidence)} text-white`}
                                  >
                                    {formatConfidence(result.confidence)}
                                  </Badge>
                                </div>
                              ) : (
                                <Badge variant="outline" className="bg-gray-500 text-white">
                                  Tidak Dikenal
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge className={result.score >= 21 ? 'bg-green-500' : result.score >= 15 ? 'bg-yellow-500' : 'bg-red-500'}>
                                {result.score}/30
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={result.structureScore >= 11 ? 'bg-green-500' : result.structureScore >= 8 ? 'bg-yellow-500' : 'bg-red-500'}>
                                {result.structureScore}/15
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={result.writtenExpressionScore >= 11 ? 'bg-green-500' : result.writtenExpressionScore >= 8 ? 'bg-yellow-500' : 'bg-red-500'}>
                                {result.writtenExpressionScore}/15
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {Math.floor(result.timeElapsed / 60)}m {result.timeElapsed % 60}s
                            </TableCell>
                            <TableCell>
                              {new Date(result.created_at).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>
              
              {showExplanations && (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="text-xl font-semibold">Question Explanations</CardTitle>
                    <CardDescription>Explanations for all quiz questions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px] rounded-md border">
                      <div className="p-4 space-y-6">
                        <div>
                          <h3 className="text-lg font-semibold mb-2">Structure Questions (1-15)</h3>
                          <div className="space-y-4">
                            {questions.filter(q => q.type === 'Structure').map(question => (
                              <div key={question.id} className="p-3 border rounded-md">
                                <h4 className="font-medium">Question {question.id}</h4>
                                <p className="text-sm mt-1">{question.explanation}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <h3 className="text-lg font-semibold mb-2">Written Expression Questions (16-30)</h3>
                          <div className="space-y-4">
                            {questions.filter(q => q.type === 'Written Expression').map(question => (
                              <div key={question.id} className="p-3 border rounded-md">
                                <h4 className="font-medium">Question {question.id}</h4>
                                <p className="text-sm mt-1">{question.explanation}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            
            <TabsContent value="students" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl font-semibold">Student List</CardTitle>
                  <CardDescription>View all students and their quiz completion status</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px] rounded-md border">
                    <Table>
                      <TableCaption>List of all students in class 12.C</TableCaption>
                      <TableHeader>
                        <TableRow>
                          <TableHead>No</TableHead>
                          <TableHead>Nama</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {students
                          .filter(student => !student.isExcluded)
                          .map((student, index) => (
                            <TableRow key={index}>
                              <TableCell>{index + 1}</TableCell>
                              <TableCell>{student.name}</TableCell>
                              <TableCell>
                                {student.hasCompleted ? (
                                  <Badge className="bg-green-500 flex items-center gap-1">
                                    <CheckCircle className="h-3 w-3" /> Completed
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="bg-red-500 text-white flex items-center gap-1">
                                    <XCircle className="h-3 w-3" /> Not Completed
                                  </Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
};

export default Admin;