// ============================================================
// LearnHub — Database Seed
//
// Run with: pnpm db:seed
//
// Creates:
//   - 2 INSTRUCTOR users
//   - 2 STUDENT users
//   - 6 Courses across categories + levels (mix of free + paid)
//   - Each course: 3 Modules × 3 Lessons (9 lessons per course)
//   - 1 Quiz per course: 4 Questions × 4 Options (one correct each)
//   - Sample Enrollments for demo students
//   - Realistic LessonProgress (some completed lessons) for dashboards
//   - 2 QuizAttempts so quiz results appear on dashboard
//
// Money: pricePaise stored in paise (1 INR = 100 paise). 0 = free.
// Thumbnails: https://picsum.photos/seed/<slug>/600/400
// Videos: public Google sample MP4s (no auth required)
// ============================================================

import 'dotenv/config'
import path from 'node:path'
import bcrypt from 'bcryptjs'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { PrismaClient } from '../src/generated/prisma/client'

// ─── Bootstrap DB (same URL logic as src/lib/db.ts) ──────────────────────────

function buildLibSQLUrl(): string {
  const raw = process.env.DATABASE_URL ?? 'file:./prisma/dev.db'
  if (!raw.startsWith('file:')) return raw
  const filePart = raw.slice('file:'.length)
  const absPath = path.isAbsolute(filePart)
    ? filePart
    : path.resolve(process.cwd(), filePart)
  return `file:${absPath}`
}

const adapter = new PrismaLibSql({ url: buildLibSQLUrl() })
const prisma = new PrismaClient({ adapter })

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Convert INR to paise */
const inr = (rupees: number) => Math.round(rupees * 100)

/** Days-ago Date */
function daysAgo(n: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}

// ─── Public sample video URLs ────────────────────────────────────────────────
// All from Google's public sample bucket — no auth, no API key required.

const VIDEOS = {
  blazes:      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  fun:         'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
  elephants:   'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  escape:      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  joyrides:    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
  meltdowns:   'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
  bigBuck:     'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  subconfetti: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4',
  tearsSteel:  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
}

// ─── Seed data ────────────────────────────────────────────────────────────────

interface CourseSeed {
  title: string
  slug: string
  description: string
  category: string
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
  pricePaise: number
  ratingAvg: number
  instructorKey: 'rahul' | 'priya'
  modules: ModuleSeed[]
  quiz: QuizSeed
}

interface ModuleSeed {
  title: string
  lessons: LessonSeed[]
}

interface LessonSeed {
  title: string
  videoUrl: string
  content: string
  durationSec: number
}

interface QuizSeed {
  title: string
  passingScore: number
  questions: QuestionSeed[]
}

interface QuestionSeed {
  text: string
  options: { text: string; isCorrect: boolean }[]
}

const courses: CourseSeed[] = [
  // ── 1. Web Development — BEGINNER — FREE ────────────────────────────────────
  {
    title: 'HTML & CSS for Absolute Beginners',
    slug: 'html-css-beginners',
    description: 'Learn to build beautiful web pages from scratch. No coding experience needed. You\'ll master HTML5 structure and CSS3 styling, and ship your first responsive landing page by the end of this course.',
    category: 'Web Development',
    level: 'BEGINNER',
    pricePaise: 0,
    ratingAvg: 4.7,
    instructorKey: 'rahul',
    modules: [
      {
        title: 'Getting Started with HTML',
        lessons: [
          { title: 'What is the Web? How browsers work', videoUrl: VIDEOS.blazes, content: 'An overview of the internet, HTTP, and how browsers parse HTML to render pages. We cover the request-response cycle and DOM basics.', durationSec: 540 },
          { title: 'Your first HTML document', videoUrl: VIDEOS.fun, content: 'We write a complete HTML5 boilerplate from memory, covering DOCTYPE, head, body, headings, paragraphs, and links.', durationSec: 720 },
          { title: 'Semantic HTML: sections, articles, nav', videoUrl: VIDEOS.elephants, content: 'Why semantic elements matter for accessibility and SEO. Covers header, footer, main, section, article, and nav.', durationSec: 660 },
        ],
      },
      {
        title: 'Styling with CSS',
        lessons: [
          { title: 'CSS selectors and the cascade', videoUrl: VIDEOS.escape, content: 'Specificity, inheritance, and the cascade. Class vs ID selectors, combinators, and pseudo-classes.', durationSec: 810 },
          { title: 'Box model, margin, and padding', videoUrl: VIDEOS.joyrides, content: 'Deep-dive into how browsers size elements. content-box vs border-box, margin collapse, and display types.', durationSec: 750 },
          { title: 'Flexbox layout in practice', videoUrl: VIDEOS.meltdowns, content: 'Building a navigation bar and card grid with flexbox. justify-content, align-items, flex-wrap, and gap.', durationSec: 900 },
        ],
      },
      {
        title: 'Responsive Design & Project',
        lessons: [
          { title: 'Media queries and breakpoints', videoUrl: VIDEOS.blazes, content: 'Mobile-first approach. Writing min-width media queries at 640 px and 1024 px. Viewport meta tag.', durationSec: 690 },
          { title: 'CSS Grid for page layouts', videoUrl: VIDEOS.fun, content: 'Grid template areas, repeat(), fr units, and auto-fill. Building a two-column blog layout.', durationSec: 840 },
          { title: 'Build a responsive landing page', videoUrl: VIDEOS.elephants, content: 'End-to-end project: hero section, feature cards, testimonials, footer. Deploy to GitHub Pages.', durationSec: 1200 },
        ],
      },
    ],
    quiz: {
      title: 'HTML & CSS Fundamentals Quiz',
      passingScore: 70,
      questions: [
        {
          text: 'Which HTML element is used to define the main navigation of a document?',
          options: [
            { text: '<section>', isCorrect: false },
            { text: '<nav>', isCorrect: true },
            { text: '<menu>', isCorrect: false },
            { text: '<header>', isCorrect: false },
          ],
        },
        {
          text: 'What does the CSS box model\'s "border-box" value for box-sizing do?',
          options: [
            { text: 'Adds border and padding to the element\'s total width', isCorrect: false },
            { text: 'Removes the border from the element', isCorrect: false },
            { text: 'Includes border and padding inside the element\'s specified width', isCorrect: true },
            { text: 'Makes the border invisible', isCorrect: false },
          ],
        },
        {
          text: 'Which CSS property controls the spacing between flex children?',
          options: [
            { text: 'margin', isCorrect: false },
            { text: 'spacing', isCorrect: false },
            { text: 'padding', isCorrect: false },
            { text: 'gap', isCorrect: true },
          ],
        },
        {
          text: 'In a mobile-first CSS approach, media queries use which condition?',
          options: [
            { text: 'max-width', isCorrect: false },
            { text: 'min-width', isCorrect: true },
            { text: 'min-height', isCorrect: false },
            { text: 'screen-width', isCorrect: false },
          ],
        },
      ],
    },
  },

  // ── 2. JavaScript — INTERMEDIATE — PAID ─────────────────────────────────────
  {
    title: 'JavaScript: The Complete Modern Guide',
    slug: 'javascript-complete-modern',
    description: 'Master modern JavaScript (ES2020+) from fundamentals to advanced async patterns. Covers closures, prototypes, the event loop, Promises, async/await, and real-world DOM projects. Ideal for developers who know HTML/CSS and want to build interactive web apps.',
    category: 'Web Development',
    level: 'INTERMEDIATE',
    pricePaise: inr(1999),
    ratingAvg: 4.8,
    instructorKey: 'rahul',
    modules: [
      {
        title: 'JavaScript Foundations',
        lessons: [
          { title: 'Variables, types, and coercion', videoUrl: VIDEOS.escape, content: 'let vs const vs var, primitive types, type coercion pitfalls, and strict equality. Understanding the typeof operator.', durationSec: 780 },
          { title: 'Functions, scope, and closures', videoUrl: VIDEOS.joyrides, content: 'Function declarations vs expressions vs arrow functions. Lexical scope, closure, and IIFE patterns. Practical closure examples.', durationSec: 960 },
          { title: 'Arrays and Objects deep-dive', videoUrl: VIDEOS.meltdowns, content: 'Destructuring, spread/rest, Object.keys/values/entries, array methods: map, filter, reduce, find, flatMap.', durationSec: 1080 },
        ],
      },
      {
        title: 'Async JavaScript',
        lessons: [
          { title: 'The Event Loop and Call Stack', videoUrl: VIDEOS.blazes, content: 'How JavaScript executes code: call stack, Web APIs, task queue, microtask queue. Why JS is single-threaded.', durationSec: 840 },
          { title: 'Promises and fetch()', videoUrl: VIDEOS.fun, content: 'Creating and chaining Promises. Promise.all, Promise.race. Fetching data from a public API with fetch().', durationSec: 900 },
          { title: 'async/await and error handling', videoUrl: VIDEOS.elephants, content: 'Syntactic sugar over Promises. try/catch/finally. Parallel async with Promise.all inside async functions.', durationSec: 870 },
        ],
      },
      {
        title: 'DOM Manipulation & Project',
        lessons: [
          { title: 'Selecting and modifying DOM elements', videoUrl: VIDEOS.escape, content: 'querySelector, querySelectorAll, classList API, dataset, innerHTML vs textContent, createElement and appendChild.', durationSec: 810 },
          { title: 'Events: bubbling, delegation, and custom', videoUrl: VIDEOS.joyrides, content: 'addEventListener, event object, stopPropagation, event delegation pattern, CustomEvent API.', durationSec: 750 },
          { title: 'Build a task manager app', videoUrl: VIDEOS.meltdowns, content: 'Full project: CRUD task list with localStorage persistence, drag-to-reorder (HTML5 Drag API), and filter tabs.', durationSec: 1560 },
        ],
      },
    ],
    quiz: {
      title: 'Modern JavaScript Quiz',
      passingScore: 70,
      questions: [
        {
          text: 'What is the output of: typeof null?',
          options: [
            { text: '"null"', isCorrect: false },
            { text: '"undefined"', isCorrect: false },
            { text: '"object"', isCorrect: true },
            { text: '"boolean"', isCorrect: false },
          ],
        },
        {
          text: 'Which array method returns a NEW array without mutating the original?',
          options: [
            { text: 'splice()', isCorrect: false },
            { text: 'push()', isCorrect: false },
            { text: 'sort()', isCorrect: false },
            { text: 'filter()', isCorrect: true },
          ],
        },
        {
          text: 'In the JavaScript event loop, microtasks (like resolved Promises) run:',
          options: [
            { text: 'After the next macrotask', isCorrect: false },
            { text: 'Before the next macrotask, after the current call stack is empty', isCorrect: true },
            { text: 'At the same time as the current call stack', isCorrect: false },
            { text: 'Only when setTimeout delay is 0', isCorrect: false },
          ],
        },
        {
          text: 'What does async/await syntax ultimately use under the hood?',
          options: [
            { text: 'Callbacks', isCorrect: false },
            { text: 'Generators only', isCorrect: false },
            { text: 'Promises', isCorrect: true },
            { text: 'Web Workers', isCorrect: false },
          ],
        },
      ],
    },
  },

  // ── 3. Python Data Science — BEGINNER — FREE ────────────────────────────────
  {
    title: 'Python for Data Science: Zero to Analysis',
    slug: 'python-data-science-zero',
    description: 'Start your data science journey with Python. Learn NumPy, pandas, and matplotlib to load, clean, analyse, and visualise real-world datasets. No prior Python experience needed — we\'ll get you writing data pipelines in the first session.',
    category: 'Data Science',
    level: 'BEGINNER',
    pricePaise: 0,
    ratingAvg: 4.6,
    instructorKey: 'priya',
    modules: [
      {
        title: 'Python Essentials for Data',
        lessons: [
          { title: 'Python setup and Jupyter notebooks', videoUrl: VIDEOS.bigBuck, content: 'Installing Python 3.12 via pyenv, creating a virtual environment, installing Jupyter. Tour of the notebook interface and markdown cells.', durationSec: 600 },
          { title: 'Lists, dicts, and list comprehensions', videoUrl: VIDEOS.tearsSteel, content: 'Python data structures relevant to data work. List comprehensions, dict comprehensions, and generator expressions for memory efficiency.', durationSec: 750 },
          { title: 'Functions, modules, and packages', videoUrl: VIDEOS.subconfetti, content: 'Defining reusable functions with type hints. Importing from the standard library and third-party packages. Writing clean, readable data scripts.', durationSec: 720 },
        ],
      },
      {
        title: 'NumPy and pandas',
        lessons: [
          { title: 'NumPy arrays and vectorised operations', videoUrl: VIDEOS.blazes, content: 'Creating ndarrays, slicing, broadcasting, and universal functions. Why vectorised operations are 100x faster than Python loops.', durationSec: 900 },
          { title: 'pandas DataFrames: load, inspect, clean', videoUrl: VIDEOS.fun, content: 'read_csv, head/tail/describe, handling missing values with dropna/fillna, data types, and rename. Real CSV dataset walkthrough.', durationSec: 1020 },
          { title: 'Filtering, groupby, and merge', videoUrl: VIDEOS.elephants, content: 'Boolean indexing, query(), groupby + agg, pivot_table, and merging DataFrames. Building a sales summary report.', durationSec: 960 },
        ],
      },
      {
        title: 'Visualisation & Mini-Project',
        lessons: [
          { title: 'matplotlib and seaborn charts', videoUrl: VIDEOS.escape, content: 'Line charts, bar charts, histograms, scatter plots, and heatmaps. Customising titles, axes, colours, and annotations.', durationSec: 840 },
          { title: 'Exploratory data analysis workflow', videoUrl: VIDEOS.joyrides, content: 'A repeatable EDA checklist: shape, dtypes, missing data, distributions, correlations, and outlier detection.', durationSec: 780 },
          { title: 'End-to-end project: Netflix dataset', videoUrl: VIDEOS.meltdowns, content: 'Download, load, clean, analyse, and visualise the public Netflix titles dataset. Generate a mini-report with 5 insights.', durationSec: 1440 },
        ],
      },
    ],
    quiz: {
      title: 'Python Data Science Quiz',
      passingScore: 70,
      questions: [
        {
          text: 'Which pandas method shows basic statistics (mean, std, min, max) for numeric columns?',
          options: [
            { text: 'df.info()', isCorrect: false },
            { text: 'df.stats()', isCorrect: false },
            { text: 'df.describe()', isCorrect: true },
            { text: 'df.summary()', isCorrect: false },
          ],
        },
        {
          text: 'In NumPy, what is "broadcasting"?',
          options: [
            { text: 'Sending data over a network socket', isCorrect: false },
            { text: 'Automatically expanding smaller arrays to match shapes for arithmetic', isCorrect: true },
            { text: 'Printing array contents to stdout', isCorrect: false },
            { text: 'Converting an array to a list', isCorrect: false },
          ],
        },
        {
          text: 'Which pandas function is used to load a CSV file into a DataFrame?',
          options: [
            { text: 'pd.load_csv()', isCorrect: false },
            { text: 'pd.open()', isCorrect: false },
            { text: 'pd.read_csv()', isCorrect: true },
            { text: 'pd.import_csv()', isCorrect: false },
          ],
        },
        {
          text: 'In a pandas groupby operation, what does .agg() allow you to do?',
          options: [
            { text: 'Add new columns to the DataFrame', isCorrect: false },
            { text: 'Apply multiple aggregation functions at once', isCorrect: true },
            { text: 'Filter rows based on group size', isCorrect: false },
            { text: 'Sort the grouped results', isCorrect: false },
          ],
        },
      ],
    },
  },

  // ── 4. Machine Learning — ADVANCED — PAID ───────────────────────────────────
  {
    title: 'Machine Learning Engineering in Production',
    slug: 'ml-engineering-production',
    description: 'Go beyond Jupyter notebooks. Learn to design, train, evaluate, and deploy ML models at scale. Covers feature engineering, scikit-learn pipelines, gradient boosting (XGBoost/LightGBM), model evaluation, and deploying models as REST APIs with FastAPI.',
    category: 'Data Science',
    level: 'ADVANCED',
    pricePaise: inr(3499),
    ratingAvg: 4.9,
    instructorKey: 'priya',
    modules: [
      {
        title: 'Feature Engineering & Pipelines',
        lessons: [
          { title: 'Feature selection and importance', videoUrl: VIDEOS.bigBuck, content: 'Correlation-based selection, mutual information, L1 regularisation for feature selection. Permutation importance with scikit-learn.', durationSec: 1080 },
          { title: 'Encoding categoricals and handling skew', videoUrl: VIDEOS.tearsSteel, content: 'One-hot, ordinal, target encoding. Log and Box-Cox transforms for skewed features. Handling high-cardinality.', durationSec: 960 },
          { title: 'scikit-learn Pipeline and ColumnTransformer', videoUrl: VIDEOS.subconfetti, content: 'Building end-to-end reproducible pipelines. Combining preprocessors with estimators. Cross-validating a full pipeline.', durationSec: 1020 },
        ],
      },
      {
        title: 'Gradient Boosting Models',
        lessons: [
          { title: 'Decision trees and ensemble intuition', videoUrl: VIDEOS.blazes, content: 'How decision trees split, overfitting, pruning, and why ensembles work. Bagging (Random Forest) vs boosting.', durationSec: 900 },
          { title: 'XGBoost: training, tuning, and interpreting', videoUrl: VIDEOS.fun, content: 'XGBoost API, key hyperparameters (n_estimators, max_depth, learning_rate, subsample), early stopping, SHAP values.', durationSec: 1200 },
          { title: 'LightGBM for large datasets', videoUrl: VIDEOS.elephants, content: 'Leaf-wise growth, categorical feature support, and speed vs XGBoost. Kaggle-style hyperparameter search with Optuna.', durationSec: 1080 },
        ],
      },
      {
        title: 'Model Evaluation & Deployment',
        lessons: [
          { title: 'Evaluation metrics beyond accuracy', videoUrl: VIDEOS.escape, content: 'Precision, recall, F1, ROC-AUC, PR-AUC, log loss. Choosing the right metric for imbalanced datasets. Confusion matrix analysis.', durationSec: 900 },
          { title: 'Saving, versioning, and loading models', videoUrl: VIDEOS.joyrides, content: 'joblib vs pickle, ONNX export, model cards, and MLflow tracking. Reproducibility checklist for production.', durationSec: 840 },
          { title: 'Serving a model with FastAPI', videoUrl: VIDEOS.meltdowns, content: 'Build a FastAPI app that loads a trained pipeline, exposes a /predict endpoint, handles validation with pydantic, and Dockerizes for deployment.', durationSec: 1320 },
        ],
      },
    ],
    quiz: {
      title: 'ML Engineering Quiz',
      passingScore: 70,
      questions: [
        {
          text: 'What problem does a scikit-learn Pipeline solve?',
          options: [
            { text: 'It parallelises model training across multiple GPUs', isCorrect: false },
            { text: 'It prevents data leakage by fitting transformers only on training data during cross-validation', isCorrect: true },
            { text: 'It automatically selects the best algorithm', isCorrect: false },
            { text: 'It stores models in a database', isCorrect: false },
          ],
        },
        {
          text: 'In gradient boosting, each tree is trained to:',
          options: [
            { text: 'Predict the original target independently', isCorrect: false },
            { text: 'Correct the residual errors of all previous trees', isCorrect: true },
            { text: 'Average the predictions of random feature subsets', isCorrect: false },
            { text: 'Reduce the depth of previous trees', isCorrect: false },
          ],
        },
        {
          text: 'ROC-AUC of 0.5 means the classifier:',
          options: [
            { text: 'Is perfectly accurate', isCorrect: false },
            { text: 'Performs no better than random guessing', isCorrect: true },
            { text: 'Always predicts the negative class', isCorrect: false },
            { text: 'Has 50% precision', isCorrect: false },
          ],
        },
        {
          text: 'SHAP values are used to:',
          options: [
            { text: 'Speed up model training with GPU acceleration', isCorrect: false },
            { text: 'Explain the contribution of each feature to individual predictions', isCorrect: true },
            { text: 'Select hyperparameters automatically', isCorrect: false },
            { text: 'Evaluate model performance on imbalanced datasets', isCorrect: false },
          ],
        },
      ],
    },
  },

  // ── 5. UI/UX Design — BEGINNER — PAID ───────────────────────────────────────
  {
    title: 'UI/UX Design Fundamentals with Figma',
    slug: 'uiux-design-figma',
    description: 'Learn user-centred design from research to high-fidelity prototype. Master Figma\'s core features, design systems, auto-layout, and prototyping. By the end you\'ll have a complete mobile app case study ready for your portfolio.',
    category: 'Design',
    level: 'BEGINNER',
    pricePaise: inr(1499),
    ratingAvg: 4.7,
    instructorKey: 'priya',
    modules: [
      {
        title: 'Design Principles & Research',
        lessons: [
          { title: 'Visual hierarchy, contrast, and alignment', videoUrl: VIDEOS.subconfetti, content: 'The Gestalt principles, F and Z reading patterns, white space, and how to direct user attention with size and colour contrast.', durationSec: 720 },
          { title: 'User research: interviews and surveys', videoUrl: VIDEOS.bigBuck, content: 'Writing research questions, conducting moderated and unmoderated interviews, affinity mapping, and synthesising insights into personas.', durationSec: 840 },
          { title: 'Information architecture and user flows', videoUrl: VIDEOS.tearsSteel, content: 'Card sorting, sitemap creation, task flows vs user flows, and how IA decisions cascade into navigation design.', durationSec: 780 },
        ],
      },
      {
        title: 'Figma Foundations',
        lessons: [
          { title: 'Figma interface, frames, and auto-layout', videoUrl: VIDEOS.blazes, content: 'Frames vs groups, constraints, auto-layout (direction, spacing, padding, hug/fill). Building a responsive card component.', durationSec: 900 },
          { title: 'Components, variants, and design systems', videoUrl: VIDEOS.fun, content: 'Creating reusable components, variants with properties, component sets, and organising a scalable design system with shared libraries.', durationSec: 1020 },
          { title: 'Typography and colour styles', videoUrl: VIDEOS.elephants, content: 'Setting up a type scale (8pt grid), defining colour tokens, using Figma styles and variables for dark-mode support.', durationSec: 780 },
        ],
      },
      {
        title: 'Prototyping & Case Study',
        lessons: [
          { title: 'Prototyping flows and micro-interactions', videoUrl: VIDEOS.escape, content: 'Linking frames, smart animate for smooth transitions, overlays for modals, and scroll behaviour. Recording prototype walkthrough videos.', durationSec: 840 },
          { title: 'Usability testing and iterating', videoUrl: VIDEOS.joyrides, content: 'Running remote usability tests with Maze or Lookback. Analysing heatmaps and task completion rates. Prioritising fixes with the severity matrix.', durationSec: 720 },
          { title: 'Portfolio case study: fitness app', videoUrl: VIDEOS.meltdowns, content: 'End-to-end: brief → research → wireframes → hi-fi Figma prototype → usability test → handoff. Structuring your Behance/portfolio write-up.', durationSec: 1680 },
        ],
      },
    ],
    quiz: {
      title: 'UI/UX Design Quiz',
      passingScore: 70,
      questions: [
        {
          text: 'Which Gestalt principle states that elements close to each other are perceived as a group?',
          options: [
            { text: 'Similarity', isCorrect: false },
            { text: 'Continuity', isCorrect: false },
            { text: 'Proximity', isCorrect: true },
            { text: 'Closure', isCorrect: false },
          ],
        },
        {
          text: 'In Figma, "auto-layout" is most similar to which CSS feature?',
          options: [
            { text: 'CSS Grid', isCorrect: false },
            { text: 'CSS Flexbox', isCorrect: true },
            { text: 'CSS Transforms', isCorrect: false },
            { text: 'CSS Animations', isCorrect: false },
          ],
        },
        {
          text: 'What is the primary purpose of a usability test?',
          options: [
            { text: 'Measuring developer performance', isCorrect: false },
            { text: 'Validating design decisions by observing real users attempting tasks', isCorrect: true },
            { text: 'Checking colour contrast ratios', isCorrect: false },
            { text: 'Comparing two competing products', isCorrect: false },
          ],
        },
        {
          text: 'Design tokens are:',
          options: [
            { text: 'Figma plugin licence keys', isCorrect: false },
            { text: 'Named design decisions (colours, spacing, type) stored as variables for consistency across platforms', isCorrect: true },
            { text: 'Accessibility scores assigned to components', isCorrect: false },
            { text: 'Reusable animation presets', isCorrect: false },
          ],
        },
      ],
    },
  },

  // ── 6. Cloud & DevOps — INTERMEDIATE — PAID ─────────────────────────────────
  {
    title: 'AWS + Docker: Cloud & DevOps Essentials',
    slug: 'aws-docker-devops',
    description: 'Understand cloud-native infrastructure from containers to CI/CD. Learn Docker and Docker Compose for local dev, deploy containerised apps to AWS (ECS Fargate), set up GitHub Actions pipelines, and manage infrastructure with CloudFormation. Real-world project included.',
    category: 'DevOps',
    level: 'INTERMEDIATE',
    pricePaise: inr(2499),
    ratingAvg: 4.8,
    instructorKey: 'rahul',
    modules: [
      {
        title: 'Docker from First Principles',
        lessons: [
          { title: 'Containers vs VMs: the mental model', videoUrl: VIDEOS.bigBuck, content: 'The OS-level virtualisation model, cgroups and namespaces, why containers are lighter than VMs, and where they shine vs where they don\'t.', durationSec: 780 },
          { title: 'Writing production-grade Dockerfiles', videoUrl: VIDEOS.tearsSteel, content: 'Multi-stage builds, layer caching strategies, non-root users, COPY vs ADD, .dockerignore, and minimising final image size.', durationSec: 960 },
          { title: 'Docker Compose for multi-service local dev', videoUrl: VIDEOS.subconfetti, content: 'Defining services, networks, and volumes. Health checks, environment files, and profiles. Running a Node.js + PostgreSQL stack locally.', durationSec: 900 },
        ],
      },
      {
        title: 'AWS Core Services',
        lessons: [
          { title: 'VPC, subnets, and security groups', videoUrl: VIDEOS.blazes, content: 'AWS networking fundamentals: public vs private subnets, internet gateways, NAT gateways, security groups vs NACLs, and routing tables.', durationSec: 1020 },
          { title: 'ECR: pushing Docker images to AWS', videoUrl: VIDEOS.fun, content: 'Creating an ECR repository, authenticating Docker to ECR, tagging and pushing images, and lifecycle policies for image retention.', durationSec: 720 },
          { title: 'ECS Fargate: serverless containers', videoUrl: VIDEOS.elephants, content: 'Task definitions, services, clusters, and load balancers. Deploying the containerised app from ECR to Fargate with zero server management.', durationSec: 1140 },
        ],
      },
      {
        title: 'CI/CD & Infrastructure as Code',
        lessons: [
          { title: 'GitHub Actions: build, test, push pipeline', videoUrl: VIDEOS.escape, content: 'Writing workflows with triggers, jobs, and steps. Caching dependencies, running tests, building and pushing Docker images to ECR on merge to main.', durationSec: 1080 },
          { title: 'CloudFormation for infrastructure as code', videoUrl: VIDEOS.joyrides, content: 'YAML stacks, parameters, mappings, outputs, and cross-stack references. Deploying a VPC + ECS Fargate service with a single cfn deploy command.', durationSec: 1200 },
          { title: 'Monitoring, logging, and cost controls', videoUrl: VIDEOS.meltdowns, content: 'CloudWatch Logs + metric filters, setting alarms, X-Ray tracing basics, AWS Cost Explorer, and budget alerts so you never get a surprise bill.', durationSec: 900 },
        ],
      },
    ],
    quiz: {
      title: 'Cloud & DevOps Quiz',
      passingScore: 70,
      questions: [
        {
          text: 'What is the main advantage of Docker multi-stage builds?',
          options: [
            { text: 'Running multiple containers from one Dockerfile simultaneously', isCorrect: false },
            { text: 'Producing a smaller final image by excluding build-time dependencies', isCorrect: true },
            { text: 'Automatically deploying to multiple cloud providers', isCorrect: false },
            { text: 'Enabling parallel test execution inside Docker', isCorrect: false },
          ],
        },
        {
          text: 'An AWS Security Group is:',
          options: [
            { text: 'A collection of IAM users', isCorrect: false },
            { text: 'A stateful virtual firewall controlling inbound and outbound traffic for resources', isCorrect: true },
            { text: 'A type of S3 bucket policy', isCorrect: false },
            { text: 'An encryption key management service', isCorrect: false },
          ],
        },
        {
          text: 'AWS ECS Fargate is "serverless" because:',
          options: [
            { text: 'It runs code without containers', isCorrect: false },
            { text: 'You do not manage or provision the underlying EC2 instances running your containers', isCorrect: true },
            { text: 'It requires no network configuration', isCorrect: false },
            { text: 'It automatically writes your Dockerfiles', isCorrect: false },
          ],
        },
        {
          text: 'In a GitHub Actions workflow, a "job" is:',
          options: [
            { text: 'A single shell command', isCorrect: false },
            { text: 'A set of steps that run on the same runner (virtual machine)', isCorrect: true },
            { text: 'An event that triggers the workflow', isCorrect: false },
            { text: 'A reusable workflow template', isCorrect: false },
          ],
        },
      ],
    },
  },
]

// ─── Main seed function ────────────────────────────────────────────────────────

async function main() {
  console.log('Seeding LearnHub database...\n')

  const SALT_ROUNDS = 10

  // ── 1. Users ─────────────────────────────────────────────────────────────────

  console.log('Creating users...')

  const rahulHash     = await bcrypt.hash('Instructor@1234', SALT_ROUNDS)
  const priyaHash     = await bcrypt.hash('Instructor@5678', SALT_ROUNDS)
  const student1Hash  = await bcrypt.hash('Student@1234', SALT_ROUNDS)
  const student2Hash  = await bcrypt.hash('Student@5678', SALT_ROUNDS)

  const rahul = await prisma.user.upsert({
    where: { email: 'rahul@learnhub.dev' },
    update: {
      passwordHash: rahulHash,
      name: 'Rahul Verma',
      role: 'INSTRUCTOR',
      bio: 'Senior Full-Stack Engineer with 10+ years of experience. Passionate about teaching web development and cloud technologies. 12,000+ students taught.',
      avatarUrl: 'https://picsum.photos/seed/rahul-instructor/200/200',
    },
    create: {
      email: 'rahul@learnhub.dev',
      passwordHash: rahulHash,
      name: 'Rahul Verma',
      role: 'INSTRUCTOR',
      bio: 'Senior Full-Stack Engineer with 10+ years of experience. Passionate about teaching web development and cloud technologies. 12,000+ students taught.',
      avatarUrl: 'https://picsum.photos/seed/rahul-instructor/200/200',
    },
  })

  const priya = await prisma.user.upsert({
    where: { email: 'priya@learnhub.dev' },
    update: {
      passwordHash: priyaHash,
      name: 'Priya Nair',
      role: 'INSTRUCTOR',
      bio: 'Data Scientist and ML Engineer at a Fortune 500 company. Specialises in applied ML, Python, and data storytelling. Author of two published datasets on Kaggle.',
      avatarUrl: 'https://picsum.photos/seed/priya-instructor/200/200',
    },
    create: {
      email: 'priya@learnhub.dev',
      passwordHash: priyaHash,
      name: 'Priya Nair',
      role: 'INSTRUCTOR',
      bio: 'Data Scientist and ML Engineer at a Fortune 500 company. Specialises in applied ML, Python, and data storytelling. Author of two published datasets on Kaggle.',
      avatarUrl: 'https://picsum.photos/seed/priya-instructor/200/200',
    },
  })

  const arjun = await prisma.user.upsert({
    where: { email: 'arjun@example.com' },
    update: {
      passwordHash: student1Hash,
      name: 'Arjun Mehta',
      role: 'STUDENT',
      avatarUrl: 'https://picsum.photos/seed/arjun-student/200/200',
    },
    create: {
      email: 'arjun@example.com',
      passwordHash: student1Hash,
      name: 'Arjun Mehta',
      role: 'STUDENT',
      avatarUrl: 'https://picsum.photos/seed/arjun-student/200/200',
    },
  })

  const meera = await prisma.user.upsert({
    where: { email: 'meera@example.com' },
    update: {
      passwordHash: student2Hash,
      name: 'Meera Pillai',
      role: 'STUDENT',
      avatarUrl: 'https://picsum.photos/seed/meera-student/200/200',
    },
    create: {
      email: 'meera@example.com',
      passwordHash: student2Hash,
      name: 'Meera Pillai',
      role: 'STUDENT',
      avatarUrl: 'https://picsum.photos/seed/meera-student/200/200',
    },
  })

  console.log('  4 users done')

  // ── 2. Courses, Modules, Lessons, Quizzes ────────────────────────────────────

  console.log('Creating courses, modules, lessons, and quizzes...')

  const instructorMap: Record<string, string> = {
    rahul: rahul.id,
    priya: priya.id,
  }

  // Track created course IDs for enrollments later
  const courseIdMap: Record<string, string> = {}
  // Track lesson IDs per course for progress seeding
  const lessonIdsByCourse: Record<string, string[]> = {}

  // Track quiz IDs per course for attempt seeding
  const quizIdMap: Record<string, string> = {}

  for (const courseSeed of courses) {
    // ── Upsert course ──────────────────────────────────────────────────────────
    const course = await prisma.course.upsert({
      where: { slug: courseSeed.slug },
      update: {
        title: courseSeed.title,
        description: courseSeed.description,
        category: courseSeed.category,
        level: courseSeed.level,
        pricePaise: courseSeed.pricePaise,
        thumbnailUrl: `https://picsum.photos/seed/${courseSeed.slug}/600/400`,
        instructorId: instructorMap[courseSeed.instructorKey],
        published: true,
        ratingAvg: courseSeed.ratingAvg,
      },
      create: {
        title: courseSeed.title,
        slug: courseSeed.slug,
        description: courseSeed.description,
        category: courseSeed.category,
        level: courseSeed.level,
        pricePaise: courseSeed.pricePaise,
        thumbnailUrl: `https://picsum.photos/seed/${courseSeed.slug}/600/400`,
        instructorId: instructorMap[courseSeed.instructorKey],
        published: true,
        ratingAvg: courseSeed.ratingAvg,
      },
    })

    courseIdMap[courseSeed.slug] = course.id
    lessonIdsByCourse[courseSeed.slug] = []

    // ── Delete existing modules (cascades to lessons) for idempotency ──────────
    await prisma.module.deleteMany({ where: { courseId: course.id } })

    // ── Create modules + lessons ───────────────────────────────────────────────
    for (let mi = 0; mi < courseSeed.modules.length; mi++) {
      const modSeed = courseSeed.modules[mi]
      const mod = await prisma.module.create({
        data: {
          courseId: course.id,
          title: modSeed.title,
          position: mi + 1,
        },
      })

      for (let li = 0; li < modSeed.lessons.length; li++) {
        const lessonSeed = modSeed.lessons[li]
        const lesson = await prisma.lesson.create({
          data: {
            moduleId: mod.id,
            title: lessonSeed.title,
            videoUrl: lessonSeed.videoUrl,
            content: lessonSeed.content,
            durationSec: lessonSeed.durationSec,
            position: li + 1,
          },
        })
        lessonIdsByCourse[courseSeed.slug].push(lesson.id)
      }
    }

    // ── Upsert quiz ───────────────────────────────────────────────────────────
    // Delete existing quiz (cascades to questions + options) for idempotency
    await prisma.quiz.deleteMany({ where: { courseId: course.id } })

    const quiz = await prisma.quiz.create({
      data: {
        courseId: course.id,
        title: courseSeed.quiz.title,
        passingScore: courseSeed.quiz.passingScore,
      },
    })
    quizIdMap[courseSeed.slug] = quiz.id

    for (let qi = 0; qi < courseSeed.quiz.questions.length; qi++) {
      const qSeed = courseSeed.quiz.questions[qi]
      const question = await prisma.question.create({
        data: {
          quizId: quiz.id,
          text: qSeed.text,
          position: qi + 1,
        },
      })
      for (const optSeed of qSeed.options) {
        await prisma.option.create({
          data: {
            questionId: question.id,
            text: optSeed.text,
            isCorrect: optSeed.isCorrect,
          },
        })
      }
    }
  }

  console.log(`  ${courses.length} courses + modules + lessons + quizzes done`)

  // ── 3. Enrollments ────────────────────────────────────────────────────────────

  console.log('Creating enrollments...')

  // Delete existing enrollments for enrolled users (idempotency)
  await prisma.enrollment.deleteMany({
    where: { userId: { in: [arjun.id, meera.id] } },
  })

  // Arjun: enrolled in 3 courses (HTML/CSS free, JS paid, Python DS free)
  const arjunEnrolledSlugs = ['html-css-beginners', 'javascript-complete-modern', 'python-data-science-zero']
  for (const slug of arjunEnrolledSlugs) {
    await prisma.enrollment.create({
      data: {
        userId: arjun.id,
        courseId: courseIdMap[slug],
        enrolledAt: daysAgo(Math.floor(Math.random() * 20) + 5),
      },
    })
  }

  // Meera: enrolled in 2 courses (UI/UX paid, AWS/DevOps paid)
  const meeraEnrolledSlugs = ['uiux-design-figma', 'aws-docker-devops']
  for (const slug of meeraEnrolledSlugs) {
    await prisma.enrollment.create({
      data: {
        userId: meera.id,
        courseId: courseIdMap[slug],
        enrolledAt: daysAgo(Math.floor(Math.random() * 15) + 3),
      },
    })
  }

  console.log('  enrollments done')

  // ── 4. LessonProgress ─────────────────────────────────────────────────────────

  console.log('Creating lesson progress...')

  // Delete existing progress for these users (idempotency)
  await prisma.lessonProgress.deleteMany({
    where: { userId: { in: [arjun.id, meera.id] } },
  })

  // Arjun has completed the entire HTML/CSS course (all 9 lessons)
  const htmlCssLessons = lessonIdsByCourse['html-css-beginners']
  for (const lessonId of htmlCssLessons) {
    await prisma.lessonProgress.create({
      data: {
        userId: arjun.id,
        lessonId,
        completed: true,
        completedAt: daysAgo(Math.floor(Math.random() * 10) + 1),
      },
    })
  }

  // Arjun is mid-way through the JS course: first 5 of 9 lessons done
  const jsLessons = lessonIdsByCourse['javascript-complete-modern']
  for (let i = 0; i < jsLessons.length; i++) {
    if (i < 5) {
      await prisma.lessonProgress.create({
        data: {
          userId: arjun.id,
          lessonId: jsLessons[i],
          completed: true,
          completedAt: daysAgo(Math.floor(Math.random() * 7) + 1),
        },
      })
    } else {
      // Track incomplete lesson records so progress bar is non-null
      await prisma.lessonProgress.create({
        data: {
          userId: arjun.id,
          lessonId: jsLessons[i],
          completed: false,
          completedAt: null,
        },
      })
    }
  }

  // Arjun has started Python DS — first 2 lessons done
  const pyLessons = lessonIdsByCourse['python-data-science-zero']
  for (let i = 0; i < 2; i++) {
    await prisma.lessonProgress.create({
      data: {
        userId: arjun.id,
        lessonId: pyLessons[i],
        completed: true,
        completedAt: daysAgo(3),
      },
    })
  }

  // Meera has completed 6 of 9 lessons in the UI/UX course
  const uiuxLessons = lessonIdsByCourse['uiux-design-figma']
  for (let i = 0; i < uiuxLessons.length; i++) {
    if (i < 6) {
      await prisma.lessonProgress.create({
        data: {
          userId: meera.id,
          lessonId: uiuxLessons[i],
          completed: true,
          completedAt: daysAgo(Math.floor(Math.random() * 8) + 2),
        },
      })
    }
  }

  // Meera has just started AWS/DevOps — first lesson done
  const awsLessons = lessonIdsByCourse['aws-docker-devops']
  await prisma.lessonProgress.create({
    data: {
      userId: meera.id,
      lessonId: awsLessons[0],
      completed: true,
      completedAt: daysAgo(1),
    },
  })

  console.log('  lesson progress done')

  // ── 5. QuizAttempts ───────────────────────────────────────────────────────────

  console.log('Creating quiz attempts...')

  // Delete existing attempts for these users (idempotency)
  await prisma.quizAttempt.deleteMany({
    where: { userId: { in: [arjun.id, meera.id] } },
  })

  // Arjun passed the HTML/CSS quiz on second attempt
  await prisma.quizAttempt.create({
    data: {
      userId: arjun.id,
      quizId: quizIdMap['html-css-beginners'],
      score: 50,
      passed: false,
      takenAt: daysAgo(5),
    },
  })
  await prisma.quizAttempt.create({
    data: {
      userId: arjun.id,
      quizId: quizIdMap['html-css-beginners'],
      score: 75,
      passed: true,
      takenAt: daysAgo(4),
    },
  })

  // Meera passed the UI/UX quiz on first attempt
  await prisma.quizAttempt.create({
    data: {
      userId: meera.id,
      quizId: quizIdMap['uiux-design-figma'],
      score: 100,
      passed: true,
      takenAt: daysAgo(2),
    },
  })

  console.log('  quiz attempts done')

  // ── 6. Summary ────────────────────────────────────────────────────────────────

  const [
    userCount,
    courseCount,
    moduleCount,
    lessonCount,
    enrollmentCount,
    progressCount,
    quizCount,
    questionCount,
    optionCount,
    attemptCount,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.course.count(),
    prisma.module.count(),
    prisma.lesson.count(),
    prisma.enrollment.count(),
    prisma.lessonProgress.count(),
    prisma.quiz.count(),
    prisma.question.count(),
    prisma.option.count(),
    prisma.quizAttempt.count(),
  ])

  console.log('\n┌──────────────────────────────────────────────┐')
  console.log('│           LearnHub Seed Complete              │')
  console.log('├──────────────────────────────────────────────┤')
  console.log(`│  users           : ${String(userCount).padStart(4)}                      │`)
  console.log(`│  courses         : ${String(courseCount).padStart(4)}                      │`)
  console.log(`│  modules         : ${String(moduleCount).padStart(4)}                      │`)
  console.log(`│  lessons         : ${String(lessonCount).padStart(4)}                      │`)
  console.log(`│  enrollments     : ${String(enrollmentCount).padStart(4)}                      │`)
  console.log(`│  lesson progress : ${String(progressCount).padStart(4)}                      │`)
  console.log(`│  quizzes         : ${String(quizCount).padStart(4)}                      │`)
  console.log(`│  questions       : ${String(questionCount).padStart(4)}                      │`)
  console.log(`│  options         : ${String(optionCount).padStart(4)}                      │`)
  console.log(`│  quiz attempts   : ${String(attemptCount).padStart(4)}                      │`)
  console.log('├──────────────────────────────────────────────┤')
  console.log('│  Demo credentials                             │')
  console.log('│                                               │')
  console.log('│  INSTRUCTOR  rahul@learnhub.dev               │')
  console.log('│              Instructor@1234                  │')
  console.log('│                                               │')
  console.log('│  INSTRUCTOR  priya@learnhub.dev               │')
  console.log('│              Instructor@5678                  │')
  console.log('│                                               │')
  console.log('│  STUDENT     arjun@example.com                │')
  console.log('│              Student@1234                     │')
  console.log('│                                               │')
  console.log('│  STUDENT     meera@example.com                │')
  console.log('│              Student@5678                     │')
  console.log('└──────────────────────────────────────────────┘\n')
}

main()
  .catch((e) => {
    console.error('Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
