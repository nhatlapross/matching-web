# Face Detection & Analysis Systems - Quick Reference

## Quick Navigation

### Core Files by Function

#### Face Detection & Analysis
- **`src/utils/faceAnalysis.ts`** - MediaPipe integration, 468-landmark detection, feature extraction
- **`src/components/physiognomy/FaceAnalyzer.tsx`** - UI component for face analysis with visualization

#### Physiognomy Analysis
- **`src/utils/physiognomy.ts`** - Chinese face reading algorithms (8 personality + 5 fortune traits)
- **`PHYSIOGNOMY_TOOL.md`** - Complete documentation with usage guide

#### Face Swapping
- **`src/utils/faceSwapUtils.ts`** - Face extraction, color matching, edge feathering
- **`src/services/faceSwapIntegrationService.ts`** - Face swap orchestration & validation

#### Photo Management
- **`src/components/AvatarUpload.tsx`** - Avatar upload with face validation
- **`src/app/members/edit/photos/`** - Photo gallery & management pages
- **`prisma/schema.prisma`** - Photo data model with approval workflow

---

## Technology Stack at a Glance

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Face Detection | **MediaPipe Face Mesh** (468 landmarks) | Physiognomy analysis, feature extraction |
| Face Detection | **face-api.js** (68 landmarks) | Avatar validation, face swap detection |
| Image Processing | **Canvas 2D API** | Face swap, color matching, feathering |
| UI | **React 18 + TypeScript** | Components, state management |
| Charts | **Recharts** | Visualization of traits & compatibility |
| Database | **Prisma** | Photo model with approval workflow |
| Storage | **Cloudinary + Walrus + Seal** | CDN + blockchain storage |

---

## API Quick Guide

### MediaPipe Face Mesh

```typescript
// Load model (from CDN)
const faceMesh = await loadFaceMesh()

// Analyze image
const features = await analyzeFaceFromImage(imageElement, faceMesh)

// Returns FaceFeatures object with:
// - faceShape, faceWidth, faceHeight
// - foreheadHeight, eyeWidth, noseLength, etc.
// - facialSymmetry (0-100), goldenRatioScore (0-100)
// - tamDinh (3-region analysis)
```

### Physiognomy Analysis

```typescript
import { analyzePhysiognomy } from '@/utils/physiognomy'

const traits = analyzePhysiognomy(features)
// Returns PhysiognomyTraits with:
// - personality (8 traits)
// - fortune (5 aspects)
// - detailed analysis for each facial feature
// - overall score (0-100)
```

### Face Swap

```typescript
import { swapFacesWithBlending } from '@/utils/faceSwapUtils'

const resultCanvas = swapFacesWithBlending(
  sourceImage,
  targetImage,
  sourceBox,      // { x, y, width, height }
  targetBox,      // { x, y, width, height }
  preserveSourceSize  // true = scale source to fit target
)

const blob = await canvasToBlob(resultCanvas)
```

---

## Common Tasks

### Task 1: Analyze a Face Image

```typescript
// In a React component
import { loadFaceMesh, analyzeFaceFromImage } from '@/utils/faceAnalysis'
import { analyzePhysiognomy } from '@/utils/physiognomy'

const [faceMesh, setFaceMesh] = useState(null)

useEffect(() => {
  loadFaceMesh().then(setFaceMesh)
}, [])

const handleAnalyze = async (imageElement) => {
  const features = await analyzeFaceFromImage(imageElement, faceMesh)
  const traits = analyzePhysiognomy(features)
  // Use traits for display
}
```

### Task 2: Swap Faces

```typescript
import { swapFacesWithBlending } from '@/utils/faceSwapUtils'

// sourceImage, targetImage are HTMLImageElement
// Boxes should be obtained from face detection
const result = swapFacesWithBlending(
  sourceImage,
  targetImage,
  sourceBox,
  targetBox,
  true
)

// Save result
result.toBlob(blob => {
  // Upload blob to storage
})
```

### Task 3: Add Face Validation to Upload

```typescript
import { validateFaceInImage } from '@/services/faceSwapIntegrationService'

const service = new FaceSwapIntegrationService()
const isValid = await service.validateImageForSwap(file)

if (isValid) {
  // Proceed with upload
}
```

### Task 4: Display Facial Analysis Results

```typescript
import FaceAnalyzer from '@/components/physiognomy/FaceAnalyzer'
import ResultsDisplay from '@/components/physiognomy/ResultsDisplay'

// Use FaceAnalyzer for input
// Use ResultsDisplay for output visualization
<FaceAnalyzer 
  onAnalysisComplete={(features, traits, imageUrl) => {
    setResults({ features, traits, imageUrl })
  }}
/>

{results && (
  <ResultsDisplay traits={results.traits} />
)}
```

---

## Data Models

### FaceFeatures

```typescript
interface FaceFeatures {
  faceShape: 'oval' | 'round' | 'square' | 'heart' | 'oblong' | 'diamond'
  faceWidth: number
  faceHeight: number
  faceRatio: number
  
  // Three regions (traditional Vietnamese)
  tamDinh: {
    thuongDinhHeight: number   // Upper (youth)
    trungDinhHeight: number    // Middle (middle age)
    haDinhHeight: number       // Lower (later years)
    balance: number            // 0-100
  }
  
  // Individual features
  foreheadHeight: number
  foreheadWidth: number
  eyeWidth: number
  eyeDistance: number
  eyeSymmetry: number          // 0-1, 1=perfect
  
  noseLength: number
  noseWidth: number
  mouthWidth: number
  lipThickness: number
  
  jawWidth: number
  jawlineDefinition: number
  chinLength: number
  
  // Scores
  facialSymmetry: number       // 0-100
  goldenRatioScore: number     // 0-100
  facialHarmony: number        // 0-100
}
```

### PhysiognomyTraits

```typescript
interface PhysiognomyTraits {
  personality: {
    leadership: number          // 0-100
    creativity: number
    sociability: number
    determination: number
    intelligence: number
    emotional: number
    practical: number
    adventurous: number
  }
  
  fortune: {
    career: number              // 0-100
    wealth: number
    love: number
    health: number
    family: number
  }
  
  // Detailed analysis
  analysis: {
    forehead: string
    eyes: string
    nose: string
    mouth: string
    jaw: string
    overall: string
  }
  
  overallScore: number          // 0-100
}
```

### FaceRegion

```typescript
interface FaceRegion {
  x: number
  y: number
  width: number
  height: number
}
```

---

## Component Hierarchy

```
Page (physiognomy/page.tsx)
├── Tab 1: Single Analysis
│   ├── FaceAnalyzer (upload & detect)
│   └── ResultsDisplay (show results)
│
└── Tab 2: Compatibility Analysis
    ├── FaceAnalyzer #1 (upload person 1)
    ├── FaceAnalyzer #2 (upload person 2)
    └── CompatibilityDisplay (show comparison)
```

---

## Error Handling

### Face Detection Fails

```typescript
const features = await analyzeFaceFromImage(imageElement, faceMesh)

if (!features) {
  // No face detected
  // Show error message: "Please upload a clear front-facing photo"
  // Optionally offer ManualFaceSelector for manual selection
}
```

### Model Loading Fails

```typescript
try {
  const faceMesh = await loadFaceMesh()
  setFaceMesh(faceMesh)
} catch (err) {
  setError('Failed to load AI models. Please refresh the page.')
}
```

### Face Swap Fails

```typescript
const result = await faceSwapService.generatePublicAvatar(file)

if (!result.success) {
  console.error(result.error)
  // Show error to user
}
```

---

## Performance Tips

### 1. Lazy Load Models
```typescript
// Models are loaded on-demand, not at app startup
// First use will have slight delay (~500-1000ms)
```

### 2. Use Canvas for Large Images
```typescript
// Always use natural dimensions for detection accuracy
canvas.width = img.naturalWidth
canvas.height = img.naturalHeight
```

### 3. Cache Model References
```typescript
// Load once and reuse
const faceMesh = await loadFaceMesh()
// Then call analyzeFaceFromImage multiple times
```

### 4. Consider Web Workers
```typescript
// For batch processing, use Web Workers to avoid blocking UI
// Currently not implemented, but could be added
```

---

## Testing

### Test Images Location
```
/public/faces/face1.png through face7.png
```

### Quick Test Flow
1. Upload test image from `/public/faces/`
2. System detects 468 landmarks
3. Extracts ~30 facial measurements
4. Generates 8 personality + 5 fortune scores
5. Displays radar & bar charts

### Expected Results
- **Accuracy:** 80-85% for feature extraction
- **Analysis Time:** 100-300ms per image
- **Model Load:** 500-1000ms first time

---

## Database Schema

### Photo Model (Prisma)
```prisma
model Photo {
  id          String   @id @default(cuid())
  userId      String
  url         String
  cloudinaryId String?
  isApproved  Boolean  @default(false)  // ← Admin approval required
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  user User @relation(fields: [userId], references: [id])
}
```

**Key Point:** Photos start with `isApproved: false` and must be manually approved by admin before display.

---

## Environment Setup

### Required Files
```
/public/models/
  └── face_landmark_68_model-weights_manifest.json
  └── face_landmark_68_model-shard1

/public/faces/
  ├── face1.png through face7.png
```

### Required Packages
```json
{
  "@mediapipe/face_mesh": "latest",
  "face-api.js": "latest",
  "recharts": "latest"
}
```

### Required Dependencies (Already Installed)
- React 18+
- Next.js 14
- TypeScript
- Prisma
- NextUI

---

## Troubleshooting

### Issue: "No face detected"
- **Cause:** Image too small, not front-facing, or face obscured
- **Solution:** Retry with clear, front-facing photo. Use ManualFaceSelector as fallback.

### Issue: Models not loading
- **Cause:** CDN unreachable or missing local files
- **Solution:** Check internet connection. Verify `/public/models/` files exist.

### Issue: Face swap produces poor results
- **Cause:** Source/target face regions poorly detected
- **Solution:** Use ManualFaceSelector to refine face regions.

### Issue: High memory usage
- **Cause:** Multiple model instances loaded
- **Solution:** Reuse model instances, not creating new ones each analysis.

### Issue: Slow face detection
- **Cause:** Large image or slow device
- **Solution:** Resize image before processing. Consider Web Workers for batch processing.

---

## Related Documentation

- **Full Report:** `CODEBASE_EXPLORATION_REPORT.md`
- **Physiognomy Tool:** `PHYSIOGNOMY_TOOL.md`
- **Project Guide:** `CLAUDE.md`
- **Design Principles:** `/context/design-principles.md`

---

## Key Contacts & References

### Technology Authors
- **MediaPipe:** Google (https://mediapipe.dev)
- **face-api.js:** Vladimir Mandic (https://github.com/vladmandic/face-api)
- **Recharts:** Recharts Team (https://recharts.org)

### Project Commits
- **Latest:** feat/kyc-image branch
- **Physiognomy Tool:** "physiognomy tool" commit
- **Face Matching:** "face match with mediapipe" commit

---

**Quick Ref Version:** 1.0
**Last Updated:** 2024
**Status:** Ready for Development
