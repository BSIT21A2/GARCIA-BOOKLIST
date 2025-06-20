import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, Alert, Button, StyleSheet } from 'react-native';
import * as SQLite from 'expo-sqlite';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
 
let db = null;
 
// Predefined popular books
const popularBooks = [
  { title: 'To Kill a Mockingbird' },
  { title: '1984' },
  { title: 'Pride and Prejudice' },
  { title: 'The Great Gatsby' },
  { title: 'Moby-Dick' },
  { title: 'The Catcher in the Rye' },
  { title: 'The Lord of the Rings' },
  { title: 'The Hobbit' },
  { title: 'Harry Potter and the Sorcerer\'s Stone' },
  { title: 'The Da Vinci Code' },
];
 
// Setup the SQLite database
const setupDatabase = async () => {
  db = await SQLite.openDatabaseAsync('books.db');
  await db.execAsync(
    `CREATE TABLE IF NOT EXISTS books (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT
    );`
  );
 
  // Insert predefined books if the table is empty
  const results = await db.getAllAsync('SELECT id FROM books;');
  if (results.length === 0) {
    for (const book of popularBooks) {
      await db.runAsync('INSERT INTO books (title) VALUES (?);', [book.title]);
    }
  }
};
 
// Home screen displays list of books
const HomeScreen = ({ navigation }) => {
  const [books, setBooks] = useState([]);
 
  useEffect(() => {
    setupDatabase().then(async () => {
      const fetchedBooks = await fetchBooks();
      setBooks(fetchedBooks);
    });
  }, []);
 
  const fetchBooks = async () => {
    if (!db) return [];
    const results = await db.getAllAsync('SELECT id, title FROM books;');
    return results.map((row, index) => ({ id: row.id, title: row.title, index: index + 1 }));
  };
 
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Book List</Text>
      <FlatList
        data={books}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={[styles.cell, styles.indexColumn]}>{item.index}</Text>
            <Text style={[styles.cell, styles.nameColumn]}>{item.title}</Text>
          </View>
        )}
      />
      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('AddBook')}>
        <Text style={styles.buttonText}>Add New Book</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Search')}>
        <Text style={styles.buttonText}>Search Books</Text>
      </TouchableOpacity>
    </View>
  );
};
 
// Add Book screen allows adding a new book
const AddBookScreen = ({ navigation }) => {
  const [text, setText] = useState('');
 
  const addBook = async () => {
    const trimmedText = text.trim();
    if (trimmedText === '') {
      Alert.alert('Error', 'Book title cannot be empty!');
      return;
    }
 
    await db.runAsync('INSERT INTO books (title) VALUES (?);', [trimmedText]);
    setText('');
    navigation.goBack(); // Go back to Home screen after adding the book
  };
 
  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Enter book title"
        value={text}
        onChangeText={setText}
        style={styles.input}
      />
      <Button title="Add Book" onPress={addBook} />
    </View>
  );
};
 
// Search screen allows searching books by title
const SearchScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [books, setBooks] = useState([]);
 
  const searchBooks = async (query) => {
    if (!query) {
      setBooks([]);
      return;
    }
 
    const results = await db.getAllAsync('SELECT id, title FROM books WHERE title LIKE ?;', [`%${query}%`]);
    setBooks(results.map((row, index) => ({ id: row.id, title: row.title, index: index + 1 })));
  };
 
  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Search for a book"
        value={searchQuery}
        onChangeText={(text) => {
          setSearchQuery(text);
          searchBooks(text);
        }}
        style={styles.input}
      />
      <FlatList
        data={books}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.nameColumn}>{item.title}</Text>
          </View>
        )}
      />
    </View>
  );
};
 
// Stack navigator setup
const Stack = createStackNavigator();
 
// Main app component with navigation container
export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="AddBook" component={AddBookScreen} />
        <Stack.Screen name="Search" component={SearchScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
 
// Styles for the screens
const styles = StyleSheet.create({
  container: {
    padding: 20,
    marginTop: 60,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#ccc',
    paddingVertical: 10,
    paddingHorizontal: 5,
  },
  indexColumn: {
    flex: 0.2,
    fontWeight: 'bold',
  },
  nameColumn: {
    flex: 1,
  },
  input: {
    borderWidth: 1,
    padding: 10,
    marginBottom: 10,
  },
  button: {
    marginTop: 20,
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
  },
});