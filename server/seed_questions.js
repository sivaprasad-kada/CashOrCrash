
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Question from './models/Question.model.js';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const questionsData = [
    {
        "number": 1,
        "text": "int x=10;\nprintf(\"%d\",x--+--x-x++);",
        "options": ["8", "9", "10", "error"],
        "correct": "10",
        "type": "text",
        "category": "CODING",
        "timeLimit": 60
    },
    {
        "number": 2,
        "text": "a = [1, 2, 3]\nb = a[:]\nb.append(4)\nprint(a)",
        "options": ["[1, 2, 3, 4]", "[1, 2, 3]", "[4]", "Error"],
        "correct": "[1, 2, 3]",
        "type": "text",
        "category": "CODING",
        "timeLimit": 45
    },
    {
        "number": 3,
        "text": "s = \"hello\"\ns[0] = \"H\"\nprint(s)",
        "options": ["\"Hello\"", "\"hello\"", "Error", "\"H\""],
        "correct": "Error",
        "type": "text",
        "category": "CODING",
        "timeLimit": 45
    },
    {
        "number": 4,
        "text": "printf(\"%d\", 5 & 3);",
        "options": ["1", "2", "3", "5"],
        "correct": "1",
        "type": "text",
        "category": "CODING",
        "timeLimit": 45
    },
    {
        "number": 5,
        "text": "for(float i = 0.1; i != 1.0; i += 0.1){ printf(\"*\"); }",
        "options": ["Runs 9 times", "Runs 10 times", "Infinite loop", "Compile error"],
        "correct": "Infinite loop",
        "type": "text",
        "category": "CODING",
        "timeLimit": 30
    },
    {
        "number": 6,
        "text": "Which unit is relative to the parent element’s font size?",
        "options": ["px", "em", "rem", "%"],
        "correct": "em",
        "type": "text",
        "category": "CODING",
        "timeLimit": 30
    },
    {
        "number": 7,
        "text": "Which operator has the lowest precedence?",
        "options": ["==", "&&", "||", "!"],
        "correct": "||",
        "type": "text",
        "category": "CODING",
        "timeLimit": 30
    },
    {
        "number": 8,
        "text": "Which statement is TRUE?",
        "options": [
            "sizeof(arr) equals sizeof(ptr) always",
            "Array name is a pointer variable",
            "Array name represents a constant address",
            "Pointer arithmetic is not allowed on arrays"
        ],
        "correct": "Array name represents a constant address",
        "type": "text",
        "category": "CODING",
        "timeLimit": 60
    },
    {
        "number": 9,
        "text": "print(\"A\" and \"B\" or \"C\" and \"\")",
        "options": ["A", "B", "C", "\"\""],
        "correct": "B",
        "type": "text",
        "category": "CODING",
        "timeLimit": 45
    },
    {
        "number": 10,
        "text": "funcs = []\nfor i in range(3):\n def f(): return i\n funcs.append(f)\nprint(funcs[0]())",
        "options": ["2 2 2", "0 1 2", "Raises an Error", "2 1 0"],
        "correct": "2 2 2",
        "type": "text",
        "category": "CODING",
        "timeLimit": 90
    },
    {
        "number": 11,
        "text": "#define SQR(x) x*x\n\nint main() {\n printf(\"%d\", SQR(3+2));\n}",
        "options": ["25", "13", "11", "15"],
        "correct": "11",
        "type": "text",
        "category": "CODING",
        "timeLimit": 60
    },
    {
        "number": 12,
        "text": "int fact(int n) {\n if(n == 0) return 0;\n return n * fact(n - 1);\n}\nprintf(\"%d\", fact(7));",
        "options": ["720", "5040", "Runtime Error", "None of the Above"],
        "correct": "None of the Above",
        "type": "text",
        "category": "CODING",
        "timeLimit": 45
    },
    {
        "number": 13,
        "text": "int fun(int n) {\n if(n == 1) return 1;\n return fun(n / 2) + 1;\n}\nWhat does this function compute?",
        "options": ["log₂(n)", "Number of bits in binary representation", "Power of two", "Prime factor count"],
        "correct": "Number of bits in binary representation",
        "type": "text",
        "category": "CODING",
        "timeLimit": 75
    },
    {
        "number": 14,
        "text": "int x = 7;\nprintf(\"%d\", x << 1 + 2);",
        "options": ["14", "28", "56", "Undefined behavior"],
        "correct": "56",
        "type": "text",
        "category": "CODING",
        "timeLimit": 75
    },
    {
        "number": 15,
        "text": "int i;\nfor(i = 1; i <= 5; i++);\n{\n printf(\"%d\", i);\n}",
        "options": ["12345", "Infinite loop", "Compilation error", "None of the Above"],
        "correct": "None of the Above",
        "type": "text",
        "category": "CODING",
        "timeLimit": 45
    },
    {
        "number": 16,
        "text": "def f():\n print(\"F\")\n return False\n\ndef g():\n print(\"G\")\n return True\n\nprint(f() and g())\nprint(g() or f())",
        "options": ["F G False True", "F False G True", "F False True", "F G False G True"],
        "correct": "F False G True",
        "type": "text",
        "category": "CODING",
        "timeLimit": 60
    },
    {
        "number": 17,
        "text": "a = [[0] * 3] * 3\na[0][0] = 1\nprint(a)",
        "options": [
            "[[1,0,0],[0,0,0],[0,0,0]]",
            "[[1,0,0],[1,0,0],[1,0,0]]",
            "[[0,0,0],[0,0,0],[0,0,0]]",
            "Raises an Error"
        ],
        "correct": "[[1,0,0],[1,0,0],[1,0,0]]",
        "type": "text",
        "category": "CODING",
        "timeLimit": 75
    },
    {
        "number": 18,
        "text": "a=256\nb=256\nc=257\nd=257\nprint(a is b)\nprint(c is d)",
        "options": ["True True", "False False", "True False", "False True"],
        "correct": "True False",
        "type": "text",
        "category": "CODING",
        "timeLimit": 60
    },
    {
        "number": 19,
        "text": "Which statement is TRUE?",
        "options": [
            "reversed(l) modifies the original list",
            "l.reverse() returns a new list",
            "reversed(l) returns an iterator",
            "Both B and C"
        ],
        "correct": "reversed(l) returns an iterator",
        "type": "text",
        "category": "CODING",
        "timeLimit": 60
    },
    {
        "number": 20,
        "text": "<form>\n <form>\n   <input>\n </form>\n</form>\nHow many forms exist?",
        "options": ["1", "0", "2", "Error"],
        "correct": "1",
        "type": "text",
        "category": "CODING",
        "timeLimit": 30
    },
    {
        "number": 21,
        "text": "p { margin-top:20px; margin-bottom:30px; }\nTotal vertical space between two <p> tags?",
        "options": ["50px", "20px", "30px", "0"],
        "correct": "30px",
        "type": "text",
        "category": "CODING",
        "timeLimit": 45
    },
    {
        "number": 22,
        "text": "<p>Hello</p>\np { display:inline; width:200px; }\nWidth applied?",
        "options": ["Yes", "No", "Partially", "Browser dependent"],
        "correct": "No",
        "type": "text",
        "category": "CODING",
        "timeLimit": 45
    },
    {
        "number": 23,
        "text": "<a href=\"#\">Click</a>\nWhat happens when clicked?",
        "options": ["Nothing", "Page reload", "Scrolls to top", "Open new tab"],
        "correct": "Scrolls to top",
        "type": "text",
        "category": "CODING",
        "timeLimit": 30
    },
    {
        "number": 24,
        "text": "What type of audio files can be played using HTML5?",
        "options": ["MP3 only", "WAV only", "OGG only", "MP3, WAV, and OGG"],
        "correct": "MP3, WAV, and OGG",
        "type": "text",
        "category": "CODING",
        "timeLimit": 30
    },
    {
        "number": 25,
        "text": "#include <stdio.h>\nint f() { return printf(\"Hi\"); }\nint main() { printf(\"%d\", f()); }",
        "options": ["Hi", "Hi2", "2", "error"],
        "correct": "Hi2",
        "type": "text",
        "category": "CODING",
        "timeLimit": 45
    },
    {
        "number": 26,
        "text": "int main() {\n int x = 10;\n if(x = 20) printf(\"Yes\"); else printf(\"No\");\n}",
        "options": ["Yes", "No", "error", "garbage"],
        "correct": "Yes",
        "type": "text",
        "category": "CODING",
        "timeLimit": 45
    },
    {
        "number": 27,
        "text": "int main() {\n static int x;\n if(x) printf(\"True\"); else printf(\"False\");\n}",
        "options": ["True", "False", "garbage", "Error"],
        "correct": "False",
        "type": "text",
        "category": "CODING",
        "timeLimit": 45
    },
    {
        "number": 28,
        "text": "int main() {\n int i = 10;\n printf(\"%d %d\", i, i++);\n}",
        "options": ["10 11", "11 10", "10 10", "11 11"],
        "correct": "11 10",
        "type": "text",
        "category": "CODING",
        "timeLimit": 45
    },
    {
        "number": 29,
        "text": "Which exception is unchecked in Java?",
        "options": ["IOException", "SQLException", "NullPointerException", "FileNotFoundException"],
        "correct": "NullPointerException",
        "type": "text",
        "category": "CODING",
        "timeLimit": 45
    },
    {
        "number": 30,
        "text": "Java uses which memory for objects?",
        "options": ["Stack", "Heap", "Register", "Cache"],
        "correct": "Heap",
        "type": "text",
        "category": "CODING",
        "timeLimit": 30
    },
    {
        "number": 31,
        "text": "print(0.1 + 0.2 == 0.3)",
        "options": ["True", "False", "Error", "Depends"],
        "correct": "False",
        "type": "text",
        "category": "CODING",
        "timeLimit": 30
    },
    {
        "number": 32,
        "text": "print(type(type(int)))",
        "options": ["int", "type", "class", "error"],
        "correct": "type",
        "type": "text",
        "category": "CODING",
        "timeLimit": 30
    },
    {
        "number": 33,
        "text": "Which runs first in Java?",
        "options": ["main()", "constructor", "static block", "object creation"],
        "correct": "static block",
        "type": "text",
        "category": "CODING",
        "timeLimit": 30
    },
    {
        "number": 34,
        "text": "print({1,2,3} & {3,4})",
        "options": ["{1,2}", "{3}", "{}", "Error"],
        "correct": "{3}",
        "type": "text",
        "category": "CODING",
        "timeLimit": 45
    },
    {
        "number": 35,
        "text": "print(\"5\" * 2 + 3)",
        "options": ["553", "13", "TypeError", "55"],
        "correct": "TypeError",
        "type": "text",
        "category": "CODING",
        "timeLimit": 45
    },
    {
        "number": 36,
        "text": "Which HTML tag auto-closes?",
        "options": ["<p>", "<div>", "<span>", "<section>"],
        "correct": "<p>",
        "type": "text",
        "category": "CODING",
        "timeLimit": 30
    },
    {
        "number": 37,
        "text": "char *s = \"Hello\";\ns[0] = 'h';",
        "options": ["No error", "Logical error", "Runtime error", "Compilation error"],
        "correct": "Runtime error",
        "type": "text",
        "category": "CODING",
        "timeLimit": 45
    },
    {
        "number": 38,
        "text": "printf(\"%d\", (5,10));",
        "options": ["5", "10", "Error", "15"],
        "correct": "10",
        "type": "text",
        "category": "CODING",
        "timeLimit": 30
    },
    {
        "number": 39,
        "text": "let a = {}; let b = {}; console.log(a == b);",
        "options": ["true", "false", "error", "undefined"],
        "correct": "false",
        "type": "text",
        "category": "CODING",
        "timeLimit": 45
    },
    {
        "number": 40,
        "text": "def add(x, y=10): return x + y\nadd(5, None)",
        "options": ["15", "5", "Error", "None"],
        "correct": "Error",
        "type": "text",
        "category": "CODING",
        "timeLimit": 45
    },
    {
        "number": 41,
        "text": "int a[3] = {1,2,3}; printf(\"%d\", *a);",
        "options": ["Address", "0", "1", "Error"],
        "correct": "1",
        "type": "text",
        "category": "CODING",
        "timeLimit": 45
    },
    {
        "number": 42,
        "text": "var funcs=[]; for(var i=0;i<3;i++){funcs.push(function(){return i;});} funcs[0]();",
        "options": ["0", "1", "2", "3"],
        "correct": "3",
        "type": "text",
        "category": "CODING",
        "timeLimit": 75
    },
    {
        "number": 43,
        "text": "g=(i*i for i in range(3)); list(g); list(g)",
        "options": ["[0,1,4]", "[]", "Error", "None"],
        "correct": "[]",
        "type": "text",
        "category": "CODING",
        "timeLimit": 60
    },
    {
        "number": 44,
        "text": "it=iter([1,2,3]); next(it); list(it)",
        "options": ["[1,2,3]", "[3]", "[2,3]", "Error"],
        "correct": "[2,3]",
        "type": "text",
        "category": "CODING",
        "timeLimit": 60
    },
    {
        "number": 45,
        "text": "a=[1,2,3]; for i in a: a.remove(i)",
        "options": ["[1,2,3]", "[2]", "[3]", "[]"],
        "correct": "[2]",
        "type": "text",
        "category": "CODING",
        "timeLimit": 45
    },
    {
        "number": 46,
        "text": "let obj={}; obj[1]='a'; obj['1']='b'; console.log(obj[1]);",
        "options": ["a", "b", "1", "undefined"],
        "correct": "b",
        "type": "text",
        "category": "CODING",
        "timeLimit": 60
    },
    {
        "number": 47,
        "text": "g=(i for i in range(2)); print(next(g)); print(list(g))",
        "options": ["0 [0,1]", "0 []", "0 [1]", "[0,1] []"],
        "correct": "0 [1]",
        "type": "text",
        "category": "CODING",
        "timeLimit": 60
    },
    {
        "number": 48,
        "text": "a=[1,2,3]; b=a; a.clear(); a+=[4]; a+=[5]; print(a,b)",
        "options": ["[4] [5]", "[4,5] [4,5]", "[5] [4]", "Error"],
        "correct": "[4,5] [4,5]",
        "type": "text",
        "category": "CODING",
        "timeLimit": 60
    },
    {
        "number": 49,
        "text": "int a[]={1,3,5,7,9}; int x=0; for(int i=0;i<5;i++){ if(a[i]%3==0) x+=i; } printf(\"%d\",x);",
        "options": ["12", "9", "3", "5"],
        "correct": "5",
        "type": "text",
        "category": "CODING",
        "timeLimit": 45
    },
    {
        "number": 50,
        "text": "int a=8,b=5; for(int i=0;i<3;i++){ if(a>b) a-=3; else b+=2;} printf(\"%d %d\",a%b,b%a);",
        "options": ["4 5", "5 4", "0 1", "1 0"],
        "correct": "5 4",
        "type": "text",
        "category": "CODING",
        "timeLimit": 60
    },
    {
        "number": 51,
        "text": "int x = 5, y = 10;\nfor (int i = 1; i <= 3; i++) {\n if (x + y++ > 15)\n  x += i;\n else\n  y -= i;\n}\nprintf(\"%d %d\", x, y);",
        "options": ["6 7", "5 7", "5 8", "6 6"],
        "correct": "5 7",
        "type": "text",
        "category": "CODING",
        "timeLimit": 75
    },
    {
        "number": 52,
        "text": "int x = 2;\nfor (int i = 1; i <= 4; i++) {\n x = x + i * 2;\n}\nprintf(\"%d\", x);",
        "options": ["14", "18", "20", "22"],
        "correct": "22",
        "type": "text",
        "category": "CODING",
        "timeLimit": 75
    },
    {
        "number": 53,
        "text": "int a[] = {5, 10, 15};\nint x = 0;\nfor (int i = 0; i < 2; i++) {\n x += a[i++];\n a[i + 1] = a[i] + x;\n}\nprintf(\"%d\", a[2]);",
        "options": ["15", "20", "25", "30"],
        "correct": "15",
        "type": "text",
        "category": "CODING",
        "timeLimit": 75
    },
    {
        "number": 54,
        "text": "int f(int n) {\n if (n == 0) return 1;\n int x = f(n - 1);\n printf(\"%d \", x);\n return x + 1;\n}\nprintf(\"%d\", f(3));",
        "options": ["1 2 3 4", "1 2 3 3", "1 2 3 4 4", "1 1 2 3 4"],
        "correct": "1 2 3 4",
        "type": "text",
        "category": "CODING",
        "timeLimit": 75
    },
    {
        "number": 55,
        "text": "void f(int n) {\n if (n == 0) return;\n printf(\"%d \", n);\n f(n - 1);\n printf(\"%d \", n);\n}\nf(3);",
        "options": ["3 2 1 1 2 3", "1 2 3 3 2 1", "3 2 1 2 3", "3 2 1 1 3"],
        "correct": "3 2 1 1 2 3",
        "type": "text",
        "category": "CODING",
        "timeLimit": 75
    },
    {
        "number": 56,
        "text": "int arr[5]={1,2,3,4,5};\nint *p=arr;\nprintf(\"%d\", *p++ + *p);",
        "options": ["1", "2", "3", "ERROR"],
        "correct": "3",
        "type": "text",
        "category": "CODING",
        "timeLimit": 60
    },
    {
        "number": 57,
        "text": "int main(){\n if(10 > 5 > 2)\n  printf(\"true\");\n else\n  printf(\"false\");\n}",
        "options": ["true", "false", "Error", "Wrong Syntax"],
        "correct": "false",
        "type": "text",
        "category": "CODING",
        "timeLimit": 45
    },
    {
        "number": 58,
        "text": "i = 100\nfor i in range(10):\n print(\"hi\")\nprint(i)",
        "options": ["100", "10", "9", "ERROR"],
        "correct": "9",
        "type": "text",
        "category": "CODING",
        "timeLimit": 45
    },
    {
        "number": 59,
        "text": "a=\"7\"\nb=\"2\"\nprint(int(a+b)-int(b+a))",
        "options": ["5", "45", "9", "54"],
        "correct": "45",
        "type": "text",
        "category": "CODING",
        "timeLimit": 45
    },
    {
        "number": 60,
        "text": "int a[]={1,2,3,4};\nint *p=a+1;\n*(p++)+=10;\n*p+=20;\nprintf(\"%d %d %d %d\",a[0],a[1],a[2],a[3]);",
        "options": ["1 13 23 4", "1 12 22 4", "1 11 23 4", "1 12 23 4"],
        "correct": "1 12 23 4",
        "type": "text",
        "category": "CODING",
        "timeLimit": 75
    },
    {
        "number": 61,
        "text": "GUESS THE SONG",
        "options": [],
        "correct": "",
        "type": "image",
        "image": "/uploads/questions/Q61.jpeg",
        "category": "MOVIES",
        "timeLimit": 45
    },
    {
        "number": 62,
        "text": "GUESS THE SONG",
        "options": [],
        "correct": "",
        "type": "image",
        "image": "/uploads/questions/Q62.jpeg",
        "category": "MOVIES",
        "timeLimit": 45
    },
    {
        "number": 63,
        "text": "GUESS THE MOVIE BY FRAME",
        "options": [],
        "correct": "",
        "type": "image",
        "image": "/uploads/questions/Q63.jpeg",
        "category": "MOVIES",
        "timeLimit": 45
    },
    {
        "number": 64,
        "text": "GUESS THE DIALOGUE",
        "options": [],
        "correct": "",
        "type": "image",
        "image": "/uploads/questions/Q64.jpeg",
        "category": "MOVIES",
        "timeLimit": 45
    },
    {
        "number": 65,
        "text": "GUESS THE SONG",
        "options": [],
        "correct": "",
        "type": "image",
        "image": "/uploads/questions/Q65.jpeg",
        "category": "MOVIES",
        "timeLimit": 45
    },
    {
        "number": 66,
        "text": "GUESS THE LYRICS IN TELUGU",
        "options": [],
        "correct": "",
        "type": "image",
        "image": "/uploads/questions/Q66.jpeg",
        "category": "MOVIES",
        "timeLimit": 45
    },
    {
        "number": 67,
        "text": "GUESS THE LYRICS IN TELUGU",
        "options": [],
        "correct": "",
        "type": "image",
        "image": "/uploads/questions/Q67.jpeg",
        "category": "MOVIES",
        "timeLimit": 45
    },
    {
        "number": 68,
        "text": "GUESS THE MOVIE BY CAST",
        "options": [],
        "correct": "",
        "type": "image",
        "image": "/uploads/questions/Q68.jpeg",
        "category": "MOVIES",
        "timeLimit": 45
    },
    {
        "number": 69,
        "text": "GUESS THE MOVIE BY CAST",
        "options": [],
        "correct": "",
        "type": "image",
        "image": "/uploads/questions/Q69.jpeg",
        "category": "MOVIES",
        "timeLimit": 45
    },
    {
        "number": 70,
        "text": "GUESS THE MOVIE BY CAST",
        "options": [],
        "correct": "",
        "type": "image",
        "image": "/uploads/questions/Q70.jpeg",
        "category": "MOVIES",
        "timeLimit": 45
    },
    {
        "number": 71,
        "text": "GUESS THE MOVIE BY CAST",
        "options": [],
        "correct": "",
        "type": "image",
        "image": "/uploads/questions/Q71.jpeg",
        "category": "MOVIES",
        "timeLimit": 45
    },
    {
        "number": 72,
        "text": "GUESS THE HERO AND HEROINE BY EYES",
        "options": [],
        "correct": "",
        "type": "image",
        "image": "/uploads/questions/Q72.jpeg",
        "category": "MOVIES",
        "timeLimit": 45
    },
    {
        "number": 73,
        "text": "GUESS THE LOGO",
        "options": [],
        "correct": "",
        "type": "image",
        "image": "/uploads/questions/Q73.jpeg",
        "category": "MOVIES",
        "timeLimit": 45
    },
    {
        "number": 74,
        "text": "GUESS THE LOGO",
        "options": [],
        "correct": "",
        "type": "image",
        "image": "/uploads/questions/Q74.jpeg",
        "category": "MOVIES",
        "timeLimit": 45
    },
    {
        "number": 75,
        "text": "GUESS THE LOGO",
        "options": [],
        "correct": "",
        "type": "image",
        "image": "/uploads/questions/Q75.jpeg",
        "category": "MOVIES",
        "timeLimit": 45
    },
    {
        "number": 76,
        "text": "MONO ACTION FOR 3 MOVIE NAMES",
        "options": [],
        "correct": "",
        "type": "image",
        "image": "",
        "category": "FUN",
        "timeLimit": 60
    },
    {
        "number": 77,
        "text": "MAKE THE ADMIN LAUGH",
        "options": [],
        "correct": "",
        "type": "image",
        "image": "",
        "category": "FUN",
        "timeLimit": 60
    },
    {
        "number": 78,
        "text": "DRAWING",
        "options": [],
        "correct": "",
        "type": "image",
        "image": "",
        "category": "FUN",
        "timeLimit": 75
    },
    {
        "number": 79,
        "text": "HEADSET GAME",
        "options": [],
        "correct": "",
        "type": "image",
        "image": "",
        "category": "FUN",
        "timeLimit": 60
    },
    {
        "number": 80,
        "text": "TONGUE TWISTER",
        "options": [],
        "correct": "",
        "type": "image",
        "image": "",
        "category": "FUN",
        "timeLimit": 45
    },
    {
        "number": 81,
        "text": "COMPLETE THE REMAINING LYRICS OF THE GIVEN SONG",
        "options": [],
        "correct": "",
        "type": "image",
        "image": "",
        "category": "FUN",
        "timeLimit": 45
    },
    {
        "number": 82,
        "text": "BUILD 4 LEVEL FORT USING TEA CUPS",
        "options": [],
        "correct": "",
        "type": "image",
        "image": "",
        "category": "FUN",
        "timeLimit": 90
    },
    {
        "number": 83,
        "text": "POLARITY GAME",
        "options": [],
        "correct": "",
        "type": "image",
        "image": "",
        "category": "FUN",
        "timeLimit": 90
    },
    {
        "number": 84,
        "text": "CUP AND BALL GAME",
        "options": [],
        "correct": "",
        "type": "image",
        "image": "",
        "category": "FUN",
        "timeLimit": 120
    },
    {
        "number": 85,
        "text": "FIND 4 MOVIES BY LISTENING TO SONGS",
        "options": [],
        "correct": "",
        "type": "image",
        "image": "",
        "category": "FUN",
        "timeLimit": 45
    },
    {
        "number": 86,
        "text": "GST belongs to which amendment?",
        "options": ["100", "101", "102", "103"],
        "correct": "101",
        "type": "text",
        "category": "GENERAL-KNOWLEDGE",
        "timeLimit": 40
    },
    {
        "number": 87,
        "text": "Engineer's Day is celebrated on",
        "options": ["Sep 15th", "Oct 14th", "Oct 15th", "Sep 14th"],
        "correct": "Sep 15th",
        "type": "text",
        "category": "GENERAL-KNOWLEDGE",
        "timeLimit": 40
    },
    {
        "number": 88,
        "text": "In which year did the POCSO Act come into effect?",
        "options": ["2011", "2012", "2013", "2014"],
        "correct": "2012",
        "type": "text",
        "category": "GENERAL-KNOWLEDGE",
        "timeLimit": 40
    },
    {
        "number": 89,
        "text": "What is the prize money for Bharat Ratna?",
        "options": ["25 Lakhs", "50 Lakhs", "1 Crore", "No Prize Money"],
        "correct": "No Prize Money",
        "type": "text",
        "category": "GENERAL-KNOWLEDGE",
        "timeLimit": 40
    },
    {
        "number": 90,
        "text": "What is the deepest point in the world?",
        "options": [
            "Challenger's Deep",
            "Mariana Trench",
            "Puerto Rico Trench",
            "Java Trench"
        ],
        "correct": "Challenger's Deep",
        "type": "text",
        "category": "GENERAL-KNOWLEDGE",
        "timeLimit": 40
    },
    {
        "number": 91,
        "text": "How many countries are there in BRICS?",
        "options": ["5", "7", "10", "12"],
        "correct": "10",
        "type": "text",
        "category": "GENERAL-KNOWLEDGE",
        "timeLimit": 40
    },
    {
        "number": 92,
        "text": "Which organization is not located in Geneva?",
        "options": ["WHO", "IOC", "IPO", "EFTA"],
        "correct": "IOC",
        "type": "text",
        "category": "GENERAL-KNOWLEDGE",
        "timeLimit": 40
    },
    {
        "number": 93,
        "text": "What is the headquarters of Canara Bank?",
        "options": ["New Delhi", "Mumbai", "Chennai", "Bengaluru"],
        "correct": "Bengaluru",
        "type": "text",
        "category": "GENERAL-KNOWLEDGE",
        "timeLimit": 40
    },
    {
        "number": 94,
        "text": "Which of the following is a Direct Tax?",
        "options": ["Excise Tax", "Service Tax", "GST", "Corporate Tax"],
        "correct": "Corporate Tax",
        "type": "text",
        "category": "GENERAL-KNOWLEDGE",
        "timeLimit": 40
    },
    {
        "number": 95,
        "text": "What is the capital of Australia?",
        "options": ["Sydney", "Canberra", "Melbourne", "Perth"],
        "correct": "Canberra",
        "type": "text",
        "category": "GENERAL-KNOWLEDGE",
        "timeLimit": 40
    },
    {
        "number": 96,
        "text": "Assam does not share its boundary with which of the following states?",
        "options": ["Nagaland", "Meghalaya", "Tripura", "Manipur"],
        "correct": "Tripura",
        "type": "text",
        "category": "GENERAL-KNOWLEDGE",
        "timeLimit": 40
    },
    {
        "number": 97,
        "text": "In which continent are there the most countries?",
        "options": ["Asia", "South America", "Europe", "Africa"],
        "correct": "Africa",
        "type": "text",
        "category": "GENERAL-KNOWLEDGE",
        "timeLimit": 40
    },
    {
        "number": 98,
        "text": "Vasco da Gama reached India in which year?",
        "options": ["1498", "1600", "1857", "1798"],
        "correct": "1498",
        "type": "text",
        "category": "GENERAL-KNOWLEDGE",
        "timeLimit": 40
    },
    {
        "number": 99,
        "text": "On which currency note is Rani ki Vav present?",
        "options": ["100", "20", "200", "500"],
        "correct": "100",
        "type": "text",
        "category": "GENERAL-KNOWLEDGE",
        "timeLimit": 40
    }
];

const seedQuestions = async () => {
    try {
        const EXPECTED_DB_NAME = "Cash_or_Crash";
        await mongoose.connect(process.env.MONGO_URI, { dbName: EXPECTED_DB_NAME });
        console.log(`✅ Connected to database: ${EXPECTED_DB_NAME}`);

        // a) Check if questions collection already contains exactly 99 documents
        const count = await Question.countDocuments();
        if (count === 99) {
            console.log('⚡ Collection already has exactly 99 questions. Exiting without changes.');
            process.exit(0);
        }

        // b) Delete all existing documents
        console.log('🗑️  Deleting existing questions...');
        await Question.deleteMany({});

        // c) Generate numbers from 1 to 99
        const numbers = Array.from({ length: 99 }, (_, i) => i + 1);

        // d) Shuffle the numbers randomly (Fisher-Yates shuffle)
        for (let i = numbers.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
        }

        // e) Assign each shuffled number as `questionNumber` (mapped to `number` in schema)
        const questionsToInsert = questionsData.map((q, index) => {
            const assignedNumber = numbers[index];
            return {
                ...q,
                number: assignedNumber, // Schema field
                questionNumber: assignedNumber, // Requested field
                correct: q.correct || "MANUAL_APPROVAL" // Fix for required field validation failure on empty strings
            };
        });

        // f) Insert all 99 documents using a single bulk insert
        console.log('🌱 Seeding 99 new questions with randomized numbers...');
        await Question.insertMany(questionsToInsert);

        console.log('✅ Specific seeding complete! 99 questions inserted.');
        process.exit(0);

    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
};

seedQuestions();
