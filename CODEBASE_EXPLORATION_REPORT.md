# Matching Web Codebase Exploration Report

## Executive Summary

This report documents findings from a comprehensive exploration of the matching-web codebase focusing on:
1. Face matching and face verification implementations
2. Physiognomy tool implementation
3. Photo upload and storage systems
4. Face detection and face comparison utilities

---

## 1. FACE MATCHING & VERIFICATION SYSTEMS

### 1.1 Core Face Detection Engine

**File:** `/home/alvin/matching-web/src/utils/faceAnalysis.ts` (593 lines)

**Technology Stack:**
- **MediaPipe Face Mesh** - 468 landmark face detection model
- **Face feature extraction** from normalized coordinates
- **3D coordinate support** (x, y, z depth values)

**Key Functions:**

```typescript
// Load MediaPipe Face Mesh from CDN
export async function loadFaceMesh()
// Returns: FaceMesh model with 468 landmarks

// Analyze face from image element
export async function analyzeFaceFromImage(
  imageElement: HTMLImageElement,
  faceMesh: any
): Promise<FaceFeatures | null>
// Returns: Extracted facial features or null if no face detected

// Extract facial features from landmarks
export function extractFaceFeatures(
  landmarks: { x: number; y: number; z: number }[]
): FaceFeatures
```

**Face Features Extracted (30+ measurements):**

1. **Overall Face Dimensions:**
   - Face width, height, ratio (height/width)
   - Face shape: oval, round, square, heart, oblong, diamond

2. **Facial Regions (Tam Đình - Traditional Vietnamese):**
   - **Thượng Đình (Upper):** Forehead area - Youth phase (15-30 years)
   - **Trung Đình (Middle):** Cheek area - Middle age (31-50 years)
   - **Hạ Đình (Lower):** Jaw area - Later years (51+ years)
   - Balance score between the three regions (0-100)

3. **Individual Features:**
   - **Forehead:** Height, width, ratio
   - **Eyes:** Width, distance, asymmetry, symmetry (0-1), position ratio
   - **Nose:** Length, width, bridge width, ratio
   - **Mouth:** Width, lip thickness, nose-to-mouth ratio
   - **Cheeks:** Bone width, prominence (3D)
   - **Jaw:** Width, definition level, chin length

4. **Harmony & Symmetry Scores:**
   - **Facial Symmetry:** 0-100 (calculated from 6 landmark pairs)
   - **Golden Ratio Score:** 0-100 (based on phi = 1.618)
   - **Facial Harmony:** Average of symmetry and golden ratio

**Face Detection Accuracy:**
- Face Detection: ~90% (face-api.js SSD MobileNet)
- Landmark Detection: ~85% (468-point model)
- Feature Extraction: ~80-85% (custom algorithms)

---

### 1.2 Face Matching Component

**File:** `/home/alvin/matching-web/src/components/physiognomy/FaceAnalyzer.tsx` (484 lines)

**Technology:**
- React 18 with TypeScript
- Forwardable ref for imperative handle methods
- Canvas-based landmark visualization

**Key Features:**

1. **Image Upload & Validation:**
   - Max file size: 10MB
   - Supported formats: PNG, JPG
   - File type validation

2. **Real-time Face Detection:**
   - Automatic model loading on component mount
   - Landmark visualization with 468 dots
   - Color-coded feature groups:
     - Face outline: Red
     - Eyes: Cyan
     - Eyebrows: Blue
     - Nose: Yellow
     - Lips: Magenta

3. **Exposed Methods (via ref):**
   ```typescript
   ref.current.analyze()     // Trigger face analysis
   ref.current.hasImage()    // Check if image loaded
   ```

4. **Canvas Rendering:**
   - Natural image dimensions preserved
   - Draws key landmarks (forehead, eyes, nose, mouth, jaw)
   - Supports toggling landmark visibility

---

### 1.3 Face Swap Utilities

**File:** `/home/alvin/matching-web/src/utils/faceSwapUtils.ts` (285 lines)

**Core Functions:**

1. **Face Extraction:**
   ```typescript
   extractFace(image, box, padding = 0.3): HTMLCanvasElement
   // Extracts face region with configurable padding
   ```

2. **Color Matching:**
   ```typescript
   matchColors(faceCanvas, targetAvgColor, strength = 0.6): HTMLCanvasElement
   // Corrects source face color to match target region
   ```

3. **Edge Feathering:**
   ```typescript
   featherEdges(canvas, featherSize = 20): HTMLCanvasElement
   // Creates elliptical mask with smooth gradient edges for blending
   ```

4. **Face Swap with Blending:**
   ```typescript
   swapFacesWithBlending(
     sourceImage,
     targetImage,
     sourceBox,
     targetBox,
     preserveSourceSize = false
   ): HTMLCanvasElement
   ```
   - Preserves target image natural dimensions
   - Supports two modes:
     - **Scale mode:** Resize source to fit target face box
     - **Preserve mode:** Keep source size and position on target

---

### 1.4 Face Swap Integration Service

**File:** `/home/alvin/matching-web/src/services/faceSwapIntegrationService.ts` (299 lines)

**Main Method:**
```typescript
async generatePublicAvatar(originalImage: File): Promise<FaceSwapResult>
```

**Workflow:**
1. Validate image file (type, size)
2. Load random face from `/public/faces/`
3. Detect faces in both images using face-api.js
4. Perform face swap with blending
5. Convert result canvas to Blob
6. Return FaceSwapResult with success status

**Face Detection Models Used:**
- `ssdMobilenetv1` - Face detection
- `faceLandmark68Net` - 68-point landmark detection
- Models loaded from `/public/models/`

---

## 2. PHYSIOGNOMY ANALYSIS TOOL

### 2.1 Overview

**Documentation:** `/home/alvin/matching-web/PHYSIOGNOMY_TOOL.md`

The physiognomy tool analyzes facial features according to traditional Chinese face reading principles combined with AI-powered feature extraction.

### 2.2 Main Analysis Module

**File:** `/home/alvin/matching-web/src/utils/physiognomy.ts` (748 lines)

**Core Interface:**
```typescript
export interface PhysiognomyTraits {
  personality: {
    leadership, creativity, sociability, determination,
    intelligence, emotional, practical, adventurous // 0-100 each
  }
  fortune: {
    career, wealth, love, health, family // 0-100 each
  }
  nguQuan: {
    eyes, eyebrows, nose, mouth, ears // Text descriptions
  }
  analysis: {
    forehead, eyes, nose, mouth, jaw, overall // Detailed text
  }
  overallScore: number // 0-100
}
```

### 2.3 Feature Analysis Functions

Each analyzes one facial feature with 7-level granularity:

1. **Forehead Analysis** (lines 57-140)
   - Height ratio: 7 levels from very high (1.4+) to very low (<0.6)
   - Width analysis: Very narrow to very wide
   - Area analysis: Impact on abstract thinking vs action orientation
   - Traits assessed: Intelligence, career potential

2. **Eyebrows Analysis** (lines 142-197)
   - Position, spacing, symmetry
   - Traits assessed: Relationships, temperament, longevity

3. **Eyes Analysis** (lines 199-268) - **MOST IMPORTANT**
   - "Nhãn thần" (eye spirit/brightness)
   - Size, symmetry, distance analysis
   - Traits assessed: Emotional balance, sociability, spiritual clarity
   - Perfect symmetry (>0.95) + harmony (>85) = strong eye spirit

4. **Nose Analysis** (lines 270-371) - **WEALTH INDICATOR**
   - Height ratio: 7 levels from 2.0+ to <0.8
   - Width analysis: Very wide to very narrow
   - Bridge strength: Indicative of willpower
   - Traits assessed: Wealth, determination, middle-age fortune

5. **Mouth Analysis** (lines 373-461)
   - Width ratio: 7 levels from very wide (2.2+) to very small
   - Lip thickness: 5 levels from very thick to very thin
   - Traits assessed: Sociability, love, communication

6. **Jaw Analysis** (lines 463-554)
   - Jawline definition: 7 levels (0.08 very defined to <0.015 soft)
   - Jaw width: 4 levels
   - Chin length: 4 levels
   - Traits assessed: Determination, willpower, health, longevity

7. **Ears Analysis** (lines 556-599)
   - Inferred from facial harmony and symmetry
   - Traits assessed: Longevity, early fortune, wisdom

### 2.4 Analysis Scoring

**Personality Traits (8 dimensions):**
- Leadership
- Creativity
- Sociability
- Determination
- Intelligence
- Emotional sensitivity
- Practical nature
- Adventurous spirit

**Fortune Aspects (5 dimensions):**
- Career success
- Wealth
- Love/relationships
- Health
- Family harmony

**Overall Score Calculation:**
```
Overall Score = (
  Facial Harmony +
  Facial Symmetry +
  Golden Ratio Score +
  Personality Average +
  Fortune Average
) / 5
// Clamped to 0-100
```

### 2.5 Face Analyzer Component

**File:** `/home/alvin/matching-web/src/components/physiognomy/FaceAnalyzer.tsx`

Features:
- Image upload with drag-and-drop
- Real-time MediaPipe face detection
- 468-landmark visualization with feature labels
- Landmark toggle button
- Integrated error handling
- Model loading state management

### 2.6 Supporting Components

**File:** `/home/alvin/matching-web/src/components/physiognomy/ResultsDisplay.tsx`
- Displays individual face analysis results
- Radar chart for 8 personality traits
- Bar chart for 5 fortune aspects
- Detailed descriptions for each feature
- Color-coded scores

**File:** `/home/alvin/matching-web/src/components/physiognomy/CompatibilityDisplay.tsx`
- Compares two faces for compatibility
- Calculates compatibility score (0-100)
- Analyzes strengths and challenges
- Provides relationship advice

### 2.7 Page Component

**File:** `/home/alvin/matching-web/src/app/physiognomy/page.tsx`

Two-mode interface:
1. **Single Analysis Mode:**
   - Upload one image
   - Get detailed physiognomy analysis
   - View personality & fortune traits

2. **Compatibility Analysis Mode:**
   - Upload two images
   - Analyze both faces
   - Calculate relationship compatibility
   - Get personalized advice

---

## 3. PHOTO UPLOAD & STORAGE SYSTEM

### 3.1 Photo Management Architecture

The system uses multiple storage backends:

1. **Traditional Storage (Cloudinary)**
   - Primary CDN for image delivery
   - Transformation support
   - Admin approval workflow

2. **Blockchain Storage (Walrus Protocol)**
   - Decentralized image storage
   - Cost-efficient for Web3 features
   - On-chain references

3. **Encrypted Storage (Seal Protocol)**
   - Subscription-gated access
   - Granular permissions
   - Privacy-preserving

### 3.2 Photo Upload Components

**File:** `/home/alvin/matching-web/src/components/AvatarUpload.tsx` (partial content shown)

Features:
- Face validation using face-api.js
- Preview states: original, face-swapped
- Integration with face swap service
- Face detection verification before upload

**File:** `/home/alvin/matching-web/src/components/AvatarUploadModal.tsx`
- Modal wrapper for avatar upload
- User experience enhancements

### 3.3 Photo Gallery Management

**Files:**
- `/home/alvin/matching-web/src/components/PhotoGalleryPage.tsx` - Gallery display
- `/home/alvin/matching-web/src/app/members/edit/photos/RegularPhotoSection.tsx` - User photo upload
- `/home/alvin/matching-web/src/app/members/edit/photos/BlockchainPhotoGallery.tsx` - On-chain photo display
- `/home/alvin/matching-web/src/app/members/edit/photos/BlockchainPhotoUpload.tsx` - Blockchain upload workflow

### 3.4 Photo Data Model

**File:** `/home/alvin/matching-web/prisma/schema.prisma`

Key Photo Model Fields:
```prisma
model Photo {
  id          String   @id @default(cuid())
  userId      String
  url         String
  cloudinaryId String?
  isApproved  Boolean  @default(false)  // Admin approval required
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relations
  user        User     @relation(fields: [userId], references: [id])
}
```

**Approval Workflow:**
- Photos must be manually approved by admin
- `isApproved` field tracks approval status
- Prevents unapproved photos from being displayed

---

## 4. FACE DETECTION & COMPARISON UTILITIES

### 4.1 Detection Technologies

**Two Detection Systems:**

1. **face-api.js** (68-point landmarks)
   - Used for: Avatar validation, face swap
   - Models: SSD MobileNet + 68-point landmarks
   - Location: `/public/models/`

2. **MediaPipe Face Mesh** (468-point landmarks)
   - Used for: Physiognomy analysis
   - Loading: Dynamic import from CDN
   - Features: Depth (3D), higher accuracy

### 4.2 Manual Face Selection

**File:** `/home/alvin/matching-web/src/components/ManualFaceSelector.tsx` (195 lines)

Purpose: Allow manual face region selection when automatic detection fails

Features:
- Canvas-based drawing interface
- Real-time region preview
- Corner handles for precise selection
- Reset functionality
- Supports arbitrary image scaling

```typescript
interface FaceRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}
```

### 4.3 Random Face Utilities

**File:** `/home/alvin/matching-web/src/utils/randomFace.ts` (37 lines)

```typescript
getRandomFaceUrl(): string  // Returns random face from 7 available
getAllFaceUrls(): string[]  // Returns all face URLs
getFaceCount(): number      // Returns 7 (hardcoded test faces)
```

**Available Test Faces:**
- `/faces/face1.png` through `/faces/face7.png` (in `/public/faces/`)

---

## 5. KEY FILES SUMMARY TABLE

| File Path | Lines | Purpose | Technology |
|-----------|-------|---------|-----------|
| `src/utils/faceAnalysis.ts` | 593 | Face detection & feature extraction | MediaPipe (468 landmarks) |
| `src/utils/physiognomy.ts` | 748 | Physiognomy analysis engine | Custom algorithms |
| `src/components/physiognomy/FaceAnalyzer.tsx` | 484 | Face upload & analysis UI | React + Canvas |
| `src/utils/faceSwapUtils.ts` | 285 | Face swap algorithms | Canvas 2D |
| `src/services/faceSwapIntegrationService.ts` | 299 | Face swap orchestration | face-api.js |
| `src/components/ManualFaceSelector.tsx` | 195 | Manual face selection tool | Canvas drawing |
| `src/components/AvatarUpload.tsx` | 100+ | Avatar upload with validation | face-api.js |
| `PHYSIOGNOMY_TOOL.md` | 196 | Physiognomy tool documentation | Vietnamese/English |

---

## 6. DATA FLOW DIAGRAMS

### Face Analysis Flow
```
User Image
    ↓
File Validation (10MB, PNG/JPG)
    ↓
Load MediaPipe Face Mesh
    ↓
detectFaceFromImage()
    ↓
Extract 468 Landmarks
    ↓
extractFaceFeatures() - Calculate 30+ measurements
    ↓
analyzePhysiognomy() - Generate traits & scores
    ↓
Display Results (Radar/Bar charts + Text)
```

### Face Swap Flow
```
User Image + Random Face
    ↓
Validate both images
    ↓
Detect faces (face-api.js 68 landmarks)
    ↓
Extract face regions
    ↓
Match colors between faces
    ↓
Apply feathering for smooth edges
    ↓
Blend onto target image
    ↓
Convert to Blob & Save
```

### Photo Upload Flow
```
Select Photo
    ↓
File validation (type, size)
    ↓
Face detection verification
    ↓
Create preview (original + face-swapped)
    ↓
Upload to Cloudinary/Walrus
    ↓
Save metadata to DB (Photo model)
    ↓
Admin approval required (isApproved: false initially)
    ↓
Display in gallery once approved
```

---

## 7. API INTEGRATION POINTS

### MediaPipe Face Mesh API
```
CDN: https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/
Models: Loaded dynamically
Landmarks: 468 3D points (x, y, z normalized)
Options: maxNumFaces: 1, refineLandmarks: true
```

### face-api.js API
```
Models:
  - ssdMobilenetv1 (face detection)
  - faceLandmark68Net (68-point landmarks)
Models Location: /public/models/
Supported Operations:
  - detectSingleFace(canvas)
  - withFaceLandmarks()
```

### Storage APIs
```
Cloudinary: URL-based image delivery + transformations
Walrus: Decentralized storage (Sui blockchain)
Seal: Encrypted access control (Sui blockchain)
```

---

## 8. CONFIGURATION & DEPENDENCIES

### Key Dependencies
```json
{
  "@mediapipe/face_mesh": "*",
  "face-api.js": "*",
  "recharts": "*",
  "react": "18+",
  "typescript": "*"
}
```

### Environment Variables Required
```
DATABASE_URL=postgresql://...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

### Model Files Location
- Face Mesh: CDN-hosted (jsdelivr)
- face-api.js: `/public/models/face_landmark_68_model-*`
- Test Faces: `/public/faces/face1.png` - `face7.png`

---

## 9. PERFORMANCE CHARACTERISTICS

### Analysis Time
- **Model Loading:** ~500-1000ms (first load)
- **Face Detection:** ~100-300ms per image
- **Physiognomy Analysis:** ~50-100ms per face
- **Face Swap:** ~500-2000ms depending on image size

### Memory Usage
- **MediaPipe Models:** ~6-8MB
- **face-api.js Models:** ~4-6MB
- **Per-analysis:** ~5-10MB temporary

### Scalability Considerations
- Client-side processing (reduces server load)
- WebGL acceleration available (not currently used)
- Progressive Web App (PWA) ready
- Offline support possible (models cached)

---

## 10. KNOWN LIMITATIONS & FUTURE IMPROVEMENTS

### Current Limitations
- Single face detection only (maxNumFaces: 1)
- Face-api.js only uses 68 landmarks (vs MediaPipe 468)
- Manual face selection required if auto-detection fails
- No video analysis support (static images only)
- No 3D face reconstruction

### Planned Improvements
- [ ] Video analysis (real-time)
- [ ] Face aging prediction
- [ ] 3D face reconstruction
- [ ] Multiple faces comparison
- [ ] Historical face database
- [ ] PDF report export
- [ ] Social media sharing
- [ ] API for developers
- [ ] Machine learning improvements
- [ ] Multi-language support
- [ ] WebGL acceleration
- [ ] Progressive Web App (PWA)
- [ ] Offline support

---

## 11. SECURITY CONSIDERATIONS

### Data Privacy
- Face analysis happens client-side (no server transmission of raw images)
- MediaPipe models: CDN-hosted, no tracking
- face-api.js models: Self-hosted in `/public/models/`

### Image Storage
- Cloudinary: Standard CDN security
- Walrus: Blockchain-backed immutability
- Seal: Encrypted at rest, access-controlled

### Photo Approval
- Admin-only approval workflow (`isApproved` flag)
- Prevents unauthorized photo display
- Audit trail via timestamps

---

## 12. REFERENCES & DOCUMENTATION

### Official Documentation
- MediaPipe Face Mesh: https://developers.google.com/mediapipe/solutions/vision/face_mesh
- face-api.js: https://github.com/vladmandic/face-api
- Recharts: https://recharts.org/

### Project Documentation
- Main Tool Doc: `/home/alvin/matching-web/PHYSIOGNOMY_TOOL.md`
- Design Principles: `/context/design-principles.md`
- CLAUDE.md: `/home/alvin/matching-web/CLAUDE.md`

### Code Patterns
- Server Actions: `/src/app/actions/`
- Hooks: `/src/hooks/`
- Schemas: `/src/lib/schemas/`
- Services: `/src/services/`

---

## 13. RECOMMENDATIONS

### For New Developers
1. Start with `PHYSIOGNOMY_TOOL.md` for feature overview
2. Review `faceAnalysis.ts` for MediaPipe integration
3. Study `physiognomy.ts` for analysis algorithms
4. Test with `/public/faces/` test images first

### For Feature Development
1. Use existing face detection infrastructure
2. Leverage Canvas API for image manipulation
3. Consider WebGL for performance-critical paths
4. Follow established error handling patterns (ErrorBoundary)

### For Performance Optimization
1. Cache model loading results
2. Implement WebGL acceleration for image processing
3. Use OffscreenCanvas for background processing
4. Consider service workers for model caching

---

**Report Generated:** 2024
**Last Updated:** Latest commit includes physiognomy tool
**Branch:** feat/kyc-image
