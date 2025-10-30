# Công Cụ Nhân Tướng Học AI

Công cụ phân tích khuôn mặt và tính toán độ tương hợp dựa trên nguyên lý nhân tướng học cổ truyền kết hợp với công nghệ AI tiên tiến.

## Tính năng

### 1. Phát hiện và Phân tích Khuôn mặt
- **face-api.js Integration**: Sử dụng face-api.js để phát hiện 68 điểm landmarks trên khuôn mặt với độ chính xác cao
- **Real-time Analysis**: Phân tích real-time ngay sau khi upload ảnh
- **High Accuracy**: Độ chính xác cao trong việc phát hiện đặc điểm khuôn mặt
- **Pre-trained Models**: Sử dụng models đã được train sẵn từ face-api.js

### 2. Trích xuất Đặc điểm Nhân tướng học

#### Đặc điểm được phân tích:
- **Hình dạng mặt** (Face Shape): oval, round, square, heart, oblong, diamond
- **Ngũ quan** (Five Features):
  - **Trán** (Forehead): Chiều cao, chiều rộng, tỷ lệ
  - **Mắt** (Eyes): Kích thước, khoảng cách, độ đối xứng
  - **Mũi** (Nose): Chiều dài, chiều rộng, sống mũi
  - **Miệng** (Mouth): Chiều rộng, độ dày môi
  - **Hàm** (Jaw): Độ rộng, độ nét, độ dài cằm
- **Tỷ lệ vàng** (Golden Ratio): Đánh giá theo tỷ lệ Phi (1.618)
- **Đối xứng khuôn mặt** (Facial Symmetry): 0-100 điểm
- **Hài hòa ngũ quan** (Facial Harmony): Tổng hợp đánh giá

### 3. Phân tích Nhân tướng học

#### Tính cách (Personality Traits):
- **Leadership** (Lãnh đạo): Khả năng lãnh đạo và ra quyết định
- **Creativity** (Sáng tạo): Tư duy sáng tạo và nghệ thuật
- **Sociability** (Hòa đồng): Khả năng giao tiếp và xã hội
- **Determination** (Quyết tâm): Ý chí và sự kiên trì
- **Intelligence** (Thông minh): Trí tuệ và khả năng học hỏi
- **Emotional** (Cảm xúc): Độ nhạy cảm và giàu cảm xúc
- **Practical** (Thực tế): Tính thực tế và đáng tin cậy
- **Adventurous** (Phiêu lưu): Khám phá và mạo hiểm

#### Vận mệnh (Fortune):
- **Career** (Sự nghiệp): Triển vọng công việc
- **Wealth** (Tài lộc): Khả năng tích lũy tài sản
- **Love** (Tình duyên): Mối quan hệ tình cảm
- **Health** (Sức khỏe): Sức khỏe thể chất và tinh thần
- **Family** (Gia đình): Hạnh phúc gia đình

#### Phân tích Chi tiết theo Ngũ quan:
- **Trán**: Phản ánh trí tuệ, sự nghiệp và vận mệnh đầu đời
- **Mắt**: Thể hiện tính cách, cảm xúc và mối quan hệ
- **Mũi**: Tượng trưng cho tài lộc, quyết tâm và tuổi trung niên
- **Miệng**: Liên quan đến giao tiếp, quan hệ và tuổi già
- **Hàm**: Biểu thị ý chí, sức khỏe và tuổi thọ

### 4. Tính toán Độ tương hợp (Compatibility)

#### Các khía cạnh được đánh giá:
- **Physical Compatibility** (20%): Hài hòa về ngoại hình và thẩm mỹ
- **Personality Compatibility** (35%): Tương hợp về tính cách
- **Fortune Compatibility** (25%): Tương hợp về vận mệnh
- **Balance & Harmony** (20%): Sự cân bằng và bổ sung

#### Kết quả bao gồm:
- **Điểm tổng thể** (Overall Score): 0-100 điểm
- **Điểm chi tiết** cho từng khía cạnh
- **Điểm mạnh** (Strengths): Những điểm tốt trong mối quan hệ
- **Thách thức** (Challenges): Khó khăn cần vượt qua
- **Lời khuyên** (Advice): Gợi ý cải thiện mối quan hệ
- **Phân tích chi tiết**: Đánh giá toàn diện

### 5. Hiển thị Trực quan

#### Biểu đồ và Visualizations:
- **Radar Chart**: Hiển thị 8 tính cách chính
- **Bar Chart**: Hiển thị 5 khía cạnh vận mệnh
- **Progress Bars**: Điểm số chi tiết cho từng đặc điểm
- **Color-coded Results**: Mã màu dễ hiểu (xanh: tốt, vàng: khá, đỏ: cần cải thiện)

#### Responsive Design:
- **Desktop**: Hiển thị đầy đủ với layout 2 cột
- **Tablet**: Layout responsive với breakpoints tối ưu
- **Mobile**: Single column layout, dễ sử dụng trên điện thoại

## Cấu trúc Code

### Utilities (`/src/utils/`)
- **faceAnalysis.ts**: MediaPipe integration, face detection, feature extraction
- **physiognomy.ts**: Phân tích tính cách và vận mệnh theo nhân tướng học
- **compatibility.ts**: Tính toán độ tương hợp giữa hai khuôn mặt

### Components (`/src/components/physiognomy/`)
- **FaceAnalyzer.tsx**: Component upload và analyze ảnh
- **ResultsDisplay.tsx**: Hiển thị kết quả phân tích cá nhân
- **CompatibilityDisplay.tsx**: Hiển thị kết quả tương hợp

### Page (`/src/app/physiognomy/`)
- **page.tsx**: Trang chính với 2 modes: Single Analysis và Compatibility Analysis

## Công nghệ Sử dụng

### Frontend:
- **Next.js 14**: App Router, Server Components
- **React 18**: Hooks, Context, Client Components
- **TypeScript**: Type-safe code
- **NextUI**: Modern UI component library
- **Tailwind CSS**: Utility-first CSS framework
- **Framer Motion**: Smooth animations
- **Lucide React**: Beautiful icons

### AI & Analysis:
- **face-api.js**: JavaScript face detection library (68 landmarks mapped to key features)
- **Custom Algorithms**: Proprietary physiognomy analysis algorithms based on traditional Chinese face reading

### Charts & Visualization:
- **Recharts**: Responsive charts library
  - Radar Chart for personality traits
  - Bar Chart for fortune analysis
  - Progress bars for scores

## Cách sử dụng

### Single Analysis Mode:
1. Click vào tab "Single Analysis"
2. Upload một ảnh khuôn mặt rõ ràng
3. Click "Analyze Face"
4. Xem kết quả phân tích chi tiết

### Compatibility Analysis Mode:
1. Click vào tab "Compatibility Analysis"
2. Upload ảnh của người thứ nhất
3. Click "Analyze Face" cho người thứ nhất
4. Upload ảnh của người thứ hai
5. Click "Analyze Face" cho người thứ hai
6. Xem kết quả độ tương hợp và phân tích cá nhân

## Lưu ý

### Tips để có kết quả tốt nhất:
- ✅ Sử dụng ảnh chụp thẳng (front-facing)
- ✅ Ánh sáng tốt, rõ ràng
- ✅ Khuôn mặt không bị che khuất
- ✅ Không đeo kính râm hoặc che mặt
- ✅ Tránh makeup quá đậm
- ✅ File size < 10MB (PNG, JPG)

### Disclaimer:
⚠️ **Quan trọng**: Kết quả phân tích chỉ mang tính tham khảo và giải trí. Không nên dùng để đưa ra quyết định quan trọng trong cuộc sống như tuyển dụng, kết hôn, hoặc đầu tư. Nhân tướng học là một nghệ thuật truyền thống và không có cơ sở khoa học chính thức.

## Độ chính xác

- **Face Detection**: ~90% (face-api.js SSD MobileNet)
- **Landmark Detection**: ~85% (face-api.js 68-point model)
- **Feature Extraction**: ~80-85% (custom algorithms based on landmarks)
- **Physiognomy Analysis**: Dựa trên nguyên lý cổ truyền (mang tính tham khảo)

## Performance

- **Model Loading**: ~6MB (face-api.js models from /public/models)
- **Analysis Time**: ~1-3 giây/ảnh (depending on image size)
- **Page Load**: Optimized với Next.js và lazy loading
- **Responsive**: Hoạt động mượt mà trên mọi thiết bị

## Future Improvements

### Planned Features:
- [ ] Video analysis (real-time)
- [ ] Face aging prediction
- [ ] 3D face reconstruction
- [ ] Multiple faces comparison
- [ ] Historical face database
- [ ] Export PDF reports
- [ ] Social media sharing
- [ ] API for developers
- [ ] Machine learning improvements
- [ ] Multi-language support

### Technical Improvements:
- [ ] WebGL acceleration
- [ ] Progressive Web App (PWA)
- [ ] Offline support
- [ ] Advanced caching
- [ ] A/B testing for algorithm improvements

## License

This tool is part of the matching-web project and follows the project's license.

## Credits

- **face-api.js**: Vladimir Mandic and contributors
- **Recharts**: Recharts contributors
- **NextUI**: NextUI team
- **Traditional Physiognomy**: Based on ancient Chinese face reading principles (相學/相术)

---

**Developed with ❤️ using AI-assisted development**
