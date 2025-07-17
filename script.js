// 全局变量
let currentImageData = null;
let analysisResult = '';
let ocrConfidence = 0;

// DOM元素
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const imagePreview = document.getElementById('imagePreview');
const progressSection = document.getElementById('progressSection');
const previewSection = document.getElementById('previewSection');
const resultsSection = document.getElementById('resultsSection');

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
});

function initializeEventListeners() {
    // 文件上传事件
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
    fileInput.addEventListener('change', handleFileSelect);
}

// 拖拽处理
function handleDragOver(e) {
    e.preventDefault();
    uploadArea.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFile(files[0]);
    }
}

function handleFileSelect(e) {
    if (e.target.files.length > 0) {
        handleFile(e.target.files[0]);
    }
}

// 文件处理
function handleFile(file) {
    if (!file.type.startsWith('image/')) {
        alert('请选择图片文件！');
        return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB限制
        alert('文件大小不能超过10MB！');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        currentImageData = {
            file: file,
            dataUrl: e.target.result,
            name: file.name,
            size: file.size,
            type: file.type,
            lastModified: new Date(file.lastModified)
        };
        
        showImagePreview();
    };
    reader.readAsDataURL(file);
}

function showImagePreview() {
    imagePreview.src = currentImageData.dataUrl;
    previewSection.classList.remove('hidden');
    resultsSection.classList.add('hidden');
}

function resetUpload() {
    currentImageData = null;
    previewSection.classList.add('hidden');
    resultsSection.classList.add('hidden');
    progressSection.classList.add('hidden');
    fileInput.value = '';
}

// 开始分析
async function startAnalysis() {
    if (!currentImageData) {
        alert('请先选择图片！');
        return;
    }

    previewSection.classList.add('hidden');
    progressSection.classList.remove('hidden');
    
    try {
        await performAnalysis();
        showResults();
    } catch (error) {
        console.error('分析失败:', error);
        alert('分析失败: ' + error.message);
        previewSection.classList.remove('hidden');
    } finally {
        progressSection.classList.add('hidden');
    }
}

async function performAnalysis() {
    // 步骤1: 基本信息分析
    updateProgress(10, '分析图片基本信息...');
    await sleep(500);
    
    // 步骤2: OCR文字识别
    updateProgress(30, '正在进行OCR文字识别...');
    const ocrText = await performOCR();
    
    // 步骤3: 图像结构分析
    updateProgress(70, '分析图像结构...');
    const structureData = await analyzeImageStructure();
    
    // 步骤4: 生成描述模板
    updateProgress(90, '生成描述模板...');
    const template = generateDescriptionTemplate(ocrText, structureData);
    
    updateProgress(100, '分析完成！');
    
    // 保存结果
    analysisResult = {
        imageInfo: getImageInfo(),
        ocrText: ocrText,
        structureData: structureData,
        template: template
    };
}

function updateProgress(percent, text) {
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    
    progressBar.style.width = percent + '%';
    progressText.textContent = text;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// OCR文字识别
async function performOCR() {
    try {
        const worker = await Tesseract.createWorker();
        await worker.loadLanguage('eng+chi_sim');
        await worker.initialize('eng+chi_sim');
        
        const { data: { text, confidence } } = await worker.recognize(currentImageData.dataUrl);
        await worker.terminate();
        
        ocrConfidence = Math.round(confidence);
        return text;
    } catch (error) {
        console.error('OCR识别失败:', error);
        return '文字识别失败';
    }
}

// 图像结构分析
async function analyzeImageStructure() {
    // 模拟图像分析过程
    await sleep(1000);
    
    // 这里可以添加更复杂的图像分析逻辑
    return {
        hasText: ocrConfidence > 50,
        hasShapes: true,
        hasLines: true,
        hasConnections: true,
        complexity: getComplexityLevel(),
        estimatedElements: Math.floor(Math.random() * 10) + 5,
        dominantColors: ['#000000', '#FFFFFF'],
        aspectRatio: calculateAspectRatio()
    };
}

function getComplexityLevel() {
    const size = currentImageData.size;
    if (size < 500 * 1024) return '简单';
    if (size < 2 * 1024 * 1024) return '中等';
    return '复杂';
}

function calculateAspectRatio() {
    // 这里需要实际计算图片尺寸，暂时返回估算值
    return '16:9';
}

// 获取图片基本信息
function getImageInfo() {
    return {
        fileName: currentImageData.name,
        fileSize: formatFileSize(currentImageData.size),
        fileType: currentImageData.type,
        lastModified: currentImageData.lastModified.toLocaleString(),
        dimensions: '待检测', // 需要实际检测
        colorDepth: '24位'
    };
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 生成描述模板
function generateDescriptionTemplate(ocrText, structureData) {
    const template = `# 图片分析报告: ${currentImageData.name}

## 基本信息
- **文件名**: ${currentImageData.name}
- **文件大小**: ${formatFileSize(currentImageData.size)}
- **文件类型**: ${currentImageData.type}
- **上传时间**: ${new Date().toLocaleString()}
- **复杂度**: ${structureData.complexity}

## OCR识别的文字内容
\`\`\`
${ocrText.trim() || '未检测到文字内容'}
\`\`\`
**识别置信度**: ${ocrConfidence}%

## 图像结构分析
- **包含文字**: ${structureData.hasText ? '✅ 是' : '❌ 否'}
- **包含几何形状**: ${structureData.hasShapes ? '✅ 是' : '❌ 否'}
- **包含连接线**: ${structureData.hasLines ? '✅ 是' : '❌ 否'}
- **包含连接关系**: ${structureData.hasConnections ? '✅ 是' : '❌ 否'}
- **估计元素数量**: ${structureData.estimatedElements}
- **宽高比**: ${structureData.aspectRatio}

## 详细描述模板
请根据图片内容填写以下信息：

### 1. 图纸类型 (请选择)
- [ ] 工艺流程图 (Process Flow Diagram)
- [ ] 管道仪表图 (P&ID)
- [ ] 设备布局图 (Equipment Layout)
- [ ] 系统架构图 (System Architecture)
- [ ] 电路图 (Circuit Diagram)
- [ ] 机械装配图 (Mechanical Assembly)
- [ ] 其他: ___________

### 2. 主要元素列表
请列出图中的主要元素及其属性：

| 序号 | 元素名称 | 形状类型 | 位置描述 | 尺寸 | 备注 |
|------|----------|----------|----------|------|------|
| 1    |          |          |          |      |      |
| 2    |          |          |          |      |      |
| 3    |          |          |          |      |      |

### 3. 连接关系
请描述元素之间的连接关系：

| 起始元素 | 目标元素 | 连接类型 | 流向 | 备注 |
|----------|----------|----------|------|------|
|          |          |          |      |      |
|          |          |          |      |      |

### 4. 布局结构
- **整体方向**: [ ] 横向 [ ] 纵向 [ ] 网格状 [ ] 放射状
- **主要流向**: [ ] 从左到右 [ ] 从上到下 [ ] 循环 [ ] 双向
- **分区情况**: [ ] 有明显分区 [ ] 无明显分区
- **层次关系**: [ ] 单层 [ ] 多层 [ ] 立体

### 5. 3D建模需求
- **重点展示**: 哪些部分需要重点3D化
- **层次关系**: 是否需要表现高度/深度关系
- **动态效果**: 是否需要流动/旋转动画效果
- **材质要求**: 金属/塑料/玻璃等材质表现
- **颜色方案**: 保持原色/统一配色/功能配色

### 6. 技术参数 (如适用)
- **工作压力**: 
- **工作温度**: 
- **流量参数**: 
- **尺寸规格**: 

---
**使用说明**: 
1. 请根据实际图片内容填写上述模板
2. 填写完成后，可以将此描述发送给AI
3. AI将基于此描述生成对应的Blender 3D建模脚本
4. 在Blender中运行脚本即可生成3D模型

**生成时间**: ${new Date().toLocaleString()}
**工具版本**: v1.0.0
`;

    return template;
}

// 显示分析结果
function showResults() {
    resultsSection.classList.remove('hidden');
    
    // 显示基本信息
    displayImageInfo();
    
    // 显示OCR结果
    displayOCRResult();
    
    // 显示结构分析
    displayStructureAnalysis();
    
    // 显示描述模板
    displayDescriptionTemplate();
}

function displayImageInfo() {
    const imageInfo = analysisResult.imageInfo;
    const infoContainer = document.getElementById('imageInfo');
    
    infoContainer.innerHTML = `
        <div class="info-item">
            <div class="info-label">📄 文件名</div>
            <div class="info-value">${imageInfo.fileName}</div>
        </div>
        <div class="info-item">
            <div class="info-label">📏 文件大小</div>
            <div class="info-value">${imageInfo.fileSize}</div>
        </div>
        <div class="info-item">
            <div class="info-label">🎨 文件类型</div>
            <div class="info-value">${imageInfo.fileType}</div>
        </div>
        <div class="info-item">
            <div class="info-label">⏰ 修改时间</div>
            <div class="info-value">${imageInfo.lastModified}</div>
        </div>
        <div class="info-item">
            <div class="info-label">📐 图片尺寸</div>
            <div class="info-value">${imageInfo.dimensions}</div>
        </div>
        <div class="info-item">
            <div class="info-label">🌈 颜色深度</div>
            <div class="info-value">${imageInfo.colorDepth}</div>
        </div>
    `;
}

function displayOCRResult() {
    const ocrResult = document.getElementById('ocrResult');
    const ocrConfidenceSpan = document.getElementById('ocrConfidence');
    
    ocrResult.textContent = analysisResult.ocrText || '未检测到文字内容';
    ocrConfidenceSpan.textContent = ocrConfidence;
    
    // 根据置信度设置颜色
    if (ocrConfidence >= 80) {
        ocrConfidenceSpan.style.color = '#28a745';
    } else if (ocrConfidence >= 60) {
        ocrConfidenceSpan.style.color = '#ffc107';
    } else {
        ocrConfidenceSpan.style.color = '#dc3545';
    }
}

function displayStructureAnalysis() {
    const structureData = analysisResult.structureData;
    const structureContainer = document.getElementById('structureAnalysis');
    
    structureContainer.innerHTML = `
        <div class="structure-item">
            <div class="structure-icon">📝</div>
            <div class="structure-label">包含文字</div>
            <div class="structure-value">${structureData.hasText ? '是' : '否'}</div>
        </div>
        <div class="structure-item">
            <div class="structure-icon">🔷</div>
            <div class="structure-label">几何形状</div>
            <div class="structure-value">${structureData.hasShapes ? '是' : '否'}</div>
        </div>
        <div class="structure-item">
            <div class="structure-icon">📏</div>
            <div class="structure-label">连接线</div>
            <div class="structure-value">${structureData.hasLines ? '是' : '否'}</div>The remote agent crashed due to an error in the model call. Would you like to continue?Add JavaScript functionality
