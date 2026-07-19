const pythonQuestions = [
  { text: "What is the output of print(2 ** 3)?", options: ["6", "8", "9", "12"], correctAnswer: 1 },
  { text: "Which keyword is used to define a function in Python?", options: ["func", "def", "function", "define"], correctAnswer: 1 },
  { text: "Which data type is mutable in Python?", options: ["Tuple", "String", "List", "Integer"], correctAnswer: 2 },
  { text: "How do you insert comments in Python code?", options: ["//", "/*", "#", "--"], correctAnswer: 2 },
  { text: "What is the correct file extension for Python files?", options: [".pt", ".pyth", ".pyt", ".py"], correctAnswer: 3 },
  { text: "Which method can be used to return a string in upper case letters?", options: ["toUpperCase()", "upperCase()", "uppercase()", "upper()"], correctAnswer: 3 },
  { text: "Which statement is used to stop a loop?", options: ["stop", "return", "exit", "break"], correctAnswer: 3 },
  { text: "What does the 'len()' function do?", options: ["Returns the length of an object", "Returns the memory size", "Returns the type", "None of the above"], correctAnswer: 0 },
  { text: "How do you create a variable with the numeric value 5?", options: ["x = int(5)", "x = 5", "Both", "None"], correctAnswer: 2 },
  { text: "What is a correct syntax to output 'Hello World' in Python?", options: ["p('Hello World')", "echo 'Hello World'", "print('Hello World')", "printf('Hello World')"], correctAnswer: 2 },
  { text: "Which collection is ordered, changeable, and allows duplicate members?", options: ["Set", "Tuple", "List", "Dictionary"], correctAnswer: 2 },
  { text: "How do you start a while loop in Python?", options: ["while x > y:", "while (x > y)", "while x > y {", "x > y while {"], correctAnswer: 0 },
  { text: "Which of the following is not a core data type in Python?", options: ["List", "Dictionary", "Tuple", "Class"], correctAnswer: 3 },
  { text: "What is the result of 3 // 2 in Python 3?", options: ["1.5", "1", "2", "0"], correctAnswer: 1 },
  { text: "Which operator is used to multiply numbers?", options: ["x", "%", "*", "#"], correctAnswer: 2 },
  { text: "What is the output of 'Hello'[0]?", options: ["e", "H", "l", "o"], correctAnswer: 1 },
  { text: "How do you access the last element of a list 'L'?", options: ["L[0]", "L[len(L)]", "L[-1]", "L[last]"], correctAnswer: 2 },
  { text: "Which method is used to add an item to the end of a list?", options: ["insert()", "push()", "add()", "append()"], correctAnswer: 3 },
  { text: "What keyword is used to handle exceptions?", options: ["catch", "except", "error", "handle"], correctAnswer: 1 },
  { text: "Is Python case-sensitive?", options: ["Yes", "No", "Only for variables", "Only for functions"], correctAnswer: 0 }
];

const javaQuestions = [
  { text: "Which of the following is not a Java feature?", options: ["Dynamic", "Architecture Neutral", "Use of pointers", "Object-oriented"], correctAnswer: 2 },
  { text: "What is the size of int variable in Java?", options: ["8 bit", "16 bit", "32 bit", "64 bit"], correctAnswer: 2 },
  { text: "Which component is used to compile, debug and execute the java programs?", options: ["JRE", "JIT", "JDK", "JVM"], correctAnswer: 2 },
  { text: "Which of these cannot be used for a variable name in Java?", options: ["identifier", "keyword", "letter", "None of the above"], correctAnswer: 1 },
  { text: "What is the extension of java code files?", options: [".js", ".txt", ".class", ".java"], correctAnswer: 3 },
  { text: "Which environment variable is used to set the java path?", options: ["MAVEN_PATH", "JAVA_HOME", "JAVA", "JAVA_PATH"], correctAnswer: 1 },
  { text: "Which keyword is used by a class to inherit a class or interface?", options: ["implements", "extends", "inherit", "import"], correctAnswer: 1 },
  { text: "Which of the following is a superclass of every class in Java?", options: ["ArrayList", "Abstract class", "Object class", "String"], correctAnswer: 2 },
  { text: "What is the correct syntax to output 'Hello World' in Java?", options: ["System.out.println('Hello World');", "echo('Hello World');", "print('Hello World');", "Console.println('Hello World');"], correctAnswer: 0 },
  { text: "Which data type is used to create a variable that should store text?", options: ["string", "String", "Txt", "myString"], correctAnswer: 1 },
  { text: "How do you create a variable with the numeric value 5 in Java?", options: ["num x = 5", "float x = 5;", "int x = 5;", "x = 5;"], correctAnswer: 2 },
  { text: "Which method can be used to find the length of a string in Java?", options: ["getSize()", "length()", "len()", "size()"], correctAnswer: 1 },
  { text: "Which operator is used to add together two values?", options: ["&", "*", "+", "-"], correctAnswer: 2 },
  { text: "To declare an array in Java, define the variable type with:", options: ["()", "{}", "[]", "<>"], correctAnswer: 2 },
  { text: "Array indexes start with:", options: ["0", "1", "-1", "Depends"], correctAnswer: 0 },
  { text: "How do you create a method in Java?", options: ["methodName[]", "methodName.", "methodName()", "(methodName)"], correctAnswer: 2 },
  { text: "Which keyword is used to create a class in Java?", options: ["class", "MyClass", "class()", "className"], correctAnswer: 0 },
  { text: "What is the default value of a boolean variable in Java?", options: ["true", "false", "null", "0"], correctAnswer: 1 },
  { text: "Which method must be implemented by all Java threads?", options: ["start()", "run()", "stop()", "execute()"], correctAnswer: 1 },
  { text: "Which of the following is a reserved keyword in Java?", options: ["object", "strictfp", "main", "system"], correctAnswer: 1 }
];

const jsQuestions = [
  { text: "Inside which HTML element do we put the JavaScript?", options: ["<js>", "<scripting>", "<script>", "<javascript>"], correctAnswer: 2 },
  { text: "What is the correct syntax for referring to an external script called 'xxx.js'?", options: ["<script src='xxx.js'>", "<script href='xxx.js'>", "<script name='xxx.js'>", "<script file='xxx.js'>"], correctAnswer: 0 },
  { text: "How do you write 'Hello World' in an alert box?", options: ["alertBox('Hello World');", "msg('Hello World');", "msgBox('Hello World');", "alert('Hello World');"], correctAnswer: 3 },
  { text: "How do you create a function in JavaScript?", options: ["function = myFunction()", "function myFunction()", "function:myFunction()", "myFunction() = function"], correctAnswer: 1 },
  { text: "How do you call a function named 'myFunction'?", options: ["call function myFunction()", "call myFunction()", "myFunction()", "myFunction.call()"], correctAnswer: 2 },
  { text: "How to write an IF statement in JavaScript?", options: ["if i = 5", "if i == 5 then", "if (i == 5)", "if i = 5 then"], correctAnswer: 2 },
  { text: "How does a WHILE loop start?", options: ["while (i <= 10)", "while i = 1 to 10", "while (i <= 10; i++)", "while i < 10 then"], correctAnswer: 0 },
  { text: "How does a FOR loop start?", options: ["for i = 1 to 5", "for (i = 0; i <= 5; i++)", "for (i <= 5; i++)", "for (i = 0; i <= 5)"], correctAnswer: 1 },
  { text: "How can you add a comment in a JavaScript?", options: ["<!--This is a comment-->", "'This is a comment", "//This is a comment", "*This is a comment*"], correctAnswer: 2 },
  { text: "What is the correct way to write a JavaScript array?", options: ["var colors = 1 = ('red'), 2 = ('green')", "var colors = ['red', 'green', 'blue']", "var colors = (1:'red', 2:'green')", "var colors = 'red', 'green', 'blue'"], correctAnswer: 1 },
  { text: "How do you round the number 7.25, to the nearest integer?", options: ["Math.round(7.25)", "round(7.25)", "rnd(7.25)", "Math.rnd(7.25)"], correctAnswer: 0 },
  { text: "How do you find the number with the highest value of x and y?", options: ["Math.ceil(x, y)", "Math.max(x, y)", "top(x, y)", "ceil(x, y)"], correctAnswer: 1 },
  { text: "JavaScript is the same as Java.", options: ["True", "False", "Partially", "None"], correctAnswer: 1 },
  { text: "Which event occurs when the user clicks on an HTML element?", options: ["onmouseclick", "onchange", "onclick", "onmouseover"], correctAnswer: 2 },
  { text: "How do you declare a JavaScript variable?", options: ["v carName;", "variable carName;", "var carName;", "declare carName;"], correctAnswer: 2 },
  { text: "Which operator is used to assign a value to a variable?", options: ["*", "-", "=", "x"], correctAnswer: 2 },
  { text: "What will the following code return: Boolean(10 > 9)", options: ["true", "false", "NaN", "undefined"], correctAnswer: 0 },
  { text: "Is JavaScript case-sensitive?", options: ["No", "Yes", "Only in strict mode", "Only for variables"], correctAnswer: 1 },
  { text: "Which keyword is used to define a constant in JS?", options: ["const", "let", "var", "constant"], correctAnswer: 0 },
  { text: "What does NaN stand for?", options: ["Not a Number", "Not a Null", "New active Number", "Null and Number"], correctAnswer: 0 }
];

const generalQuestions = [
  { text: "What is the capital of France?", options: ["Berlin", "London", "Paris", "Madrid"], correctAnswer: 2 },
  { text: "Which planet is known as the Red Planet?", options: ["Venus", "Mars", "Jupiter", "Saturn"], correctAnswer: 1 },
  { text: "Who wrote 'Hamlet'?", options: ["Charles Dickens", "William Shakespeare", "Mark Twain", "Jane Austen"], correctAnswer: 1 },
  { text: "What is the largest ocean on Earth?", options: ["Atlantic", "Indian", "Arctic", "Pacific"], correctAnswer: 3 },
  { text: "What is the square root of 64?", options: ["6", "7", "8", "9"], correctAnswer: 2 },
  { text: "Which element has the chemical symbol 'O'?", options: ["Gold", "Oxygen", "Osmium", "Ozone"], correctAnswer: 1 },
  { text: "In what year did World War II end?", options: ["1945", "1918", "1939", "1955"], correctAnswer: 0 },
  { text: "What is the tallest mountain in the world?", options: ["K2", "Mount Everest", "Kangchenjunga", "Makalu"], correctAnswer: 1 },
  { text: "Which gas do plants absorb from the atmosphere?", options: ["Oxygen", "Nitrogen", "Carbon Dioxide", "Hydrogen"], correctAnswer: 2 },
  { text: "Who painted the Mona Lisa?", options: ["Vincent van Gogh", "Pablo Picasso", "Leonardo da Vinci", "Claude Monet"], correctAnswer: 2 },
  { text: "What is the hardest natural substance on Earth?", options: ["Gold", "Iron", "Diamond", "Quartz"], correctAnswer: 2 },
  { text: "How many continents are there?", options: ["5", "6", "7", "8"], correctAnswer: 2 },
  { text: "Which is the smallest country in the world?", options: ["Monaco", "Vatican City", "San Marino", "Liechtenstein"], correctAnswer: 1 },
  { text: "What is the speed of light?", options: ["300,000 km/s", "150,000 km/s", "1,000,000 km/s", "500,000 km/s"], correctAnswer: 0 },
  { text: "Who is known as the father of computers?", options: ["Alan Turing", "Charles Babbage", "Bill Gates", "Steve Jobs"], correctAnswer: 1 },
  { text: "What is the chemical formula for water?", options: ["CO2", "H2O", "O2", "NaCl"], correctAnswer: 1 },
  { text: "Which country is home to the kangaroo?", options: ["India", "South Africa", "Australia", "Brazil"], correctAnswer: 2 },
  { text: "How many bones are in the adult human body?", options: ["206", "208", "210", "196"], correctAnswer: 0 },
  { text: "What is the primary language spoken in Brazil?", options: ["Spanish", "English", "Portuguese", "French"], correctAnswer: 2 },
  { text: "Who developed the theory of relativity?", options: ["Isaac Newton", "Albert Einstein", "Nikola Tesla", "Galileo Galilei"], correctAnswer: 1 }
];

module.exports = {
  getQuestionsForSubject(subjectName) {
    if (!subjectName) return generalQuestions;
    const lower = subjectName.toLowerCase();
    if (lower.includes("python")) return pythonQuestions;
    if (lower.includes("java") && !lower.includes("javascript")) return javaQuestions;
    if (lower.includes("javascript") || lower.includes("js")) return jsQuestions;
    return generalQuestions;
  }
};
