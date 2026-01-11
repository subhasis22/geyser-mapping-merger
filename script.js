let mergedJson = null;
let isSorted = false;

// DOM Elements
const dropZone1 = document.getElementById('dropZone1');
const dropZone2 = document.getElementById('dropZone2');
const fileInput1 = document.getElementById('fileInput1');
const fileInput2 = document.getElementById('fileInput2');
const fileName1 = document.getElementById('fileName1');
const fileName2 = document.getElementById('fileName2');
const fileSize1 = document.getElementById('fileSize1');
const fileSize2 = document.getElementById('fileSize2');
const uploadStatus1 = document.getElementById('uploadStatus1');
const uploadStatus2 = document.getElementById('uploadStatus2');
const mergeBtn = document.getElementById('mergeBtn');
const clearBtn = document.getElementById('clearBtn');
const downloadBtn = document.getElementById('downloadBtn');
const previewSection = document.getElementById('previewSection');
const jsonPreview = document.getElementById('jsonPreview');
const statsSection = document.getElementById('statsSection');
const sortBadge = document.getElementById('sortBadge');
const loadingOverlay = document.getElementById('loadingOverlay');
const messages = document.getElementById('messages');

// Stat elements
const totalItemsEl = document.getElementById('totalItems');
const uniqueTypesEl = document.getElementById('uniqueTypes');
const longestNameEl = document.getElementById('longestName');
const avgLengthEl = document.getElementById('avgLength');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
});

function setupEventListeners() {
    // Click events for upload areas
    dropZone1.addEventListener('click', () => fileInput1.click());
    dropZone2.addEventListener('click', () => fileInput2.click());
    
    // File input change events
    fileInput1.addEventListener('change', (e) => handleFileSelect(e, fileName1, fileSize1, uploadStatus1));
    fileInput2.addEventListener('change', (e) => handleFileSelect(e, fileName2, fileSize2, uploadStatus2));
    
    // Enhanced drag and drop events for both zones
    setupDragAndDrop(dropZone1, fileInput1, fileName1, fileSize1, uploadStatus1);
    setupDragAndDrop(dropZone2, fileInput2, fileName2, fileSize2, uploadStatus2);
    
    // Button events
    mergeBtn.addEventListener('click', mergeFiles);
    clearBtn.addEventListener('click', clearAll);
    downloadBtn.addEventListener('click', downloadJson);
}

function setupDragAndDrop(zone, fileInput, fileNameEl, fileSizeEl, statusEl) {
    let dragCounter = 0;
    
    zone.addEventListener('dragenter', (e) => {
        e.preventDefault();
        dragCounter++;
        if (dragCounter === 1) {
            zone.classList.add('drag-over');
        }
    });
    
    zone.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Check if files are JSON
        if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
            const item = e.dataTransfer.items[0];
            if (item.kind === 'file') {
                // Check file type
                const isJson = item.type === 'application/json' || 
                              (item.type === '' && e.dataTransfer.files[0].name.toLowerCase().endsWith('.json'));
                
                if (isJson) {
                    zone.classList.add('drag-valid');
                    zone.classList.remove('drag-invalid');
                } else {
                    zone.classList.add('drag-invalid');
                    zone.classList.remove('drag-valid');
                }
            }
        }
    });
    
    zone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dragCounter--;
        if (dragCounter <= 0) {
            dragCounter = 0;
            zone.classList.remove('drag-over', 'drag-valid', 'drag-invalid');
        }
    });
    
    zone.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        dragCounter = 0;
        zone.classList.remove('drag-over', 'drag-valid', 'drag-invalid');
        
        const files = e.dataTransfer.files;
        
        if (files.length > 0) {
            const file = files[0];
            
            // Validate file type
            if (!file.name.toLowerCase().endsWith('.json')) {
                showMessage('❌ Please drop a JSON file (.json)', 'error');
                zone.classList.add('drag-invalid');
                setTimeout(() => zone.classList.remove('drag-invalid'), 1000);
                return;
            }
            
            // Validate file size (10MB max)
            const maxSize = 10 * 1024 * 1024;
            if (file.size > maxSize) {
                showMessage(`❌ File too large (max 10MB)`, 'error');
                zone.classList.add('drag-invalid');
                setTimeout(() => zone.classList.remove('drag-invalid'), 1000);
                return;
            }
            
            // Check if empty
            if (file.size === 0) {
                showMessage('❌ File is empty', 'error');
                zone.classList.add('drag-invalid');
                setTimeout(() => zone.classList.remove('drag-invalid'), 1000);
                return;
            }
            
            // Process the file
            processDroppedFile(file, fileInput, fileNameEl, fileSizeEl, statusEl, zone);
            
            // If multiple files were dropped
            if (files.length > 1) {
                showMessage(`ℹ️ ${files.length} files dropped, using: ${file.name}`, 'warning');
            }
        }
    });
}

function processDroppedFile(file, fileInput, fileNameEl, fileSizeEl, statusEl, zone) {
    // Create a new DataTransfer to set the file
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    fileInput.files = dataTransfer.files;
    
    // Update UI
    fileNameEl.textContent = file.name;
    fileNameEl.style.color = 'var(--accent-green)';
    fileSizeEl.textContent = formatFileSize(file.size);
    
    // Show success status
    statusEl.textContent = '✓ Ready';
    statusEl.style.color = 'var(--accent-green)';
    
    // Success animation
    zone.classList.add('drag-valid');
    setTimeout(() => {
        zone.classList.remove('drag-valid');
    }, 1000);
    
    // Success message
    showMessage(`✅ Loaded: ${file.name} (${formatFileSize(file.size)})`, 'success');
    
    // Check if both files are loaded and ready to merge
    setTimeout(checkReadyToMerge, 500);
}

function handleFileSelect(event, fileNameEl, fileSizeEl, statusEl) {
    const file = event.target.files[0];
    if (file) {
        // Validate file type
        if (!file.name.toLowerCase().endsWith('.json')) {
            showMessage('❌ Please select a JSON file (.json)', 'error');
            event.target.value = '';
            return;
        }
        
        // Validate file size
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            showMessage(`❌ File too large (max 10MB)`, 'error');
            event.target.value = '';
            return;
        }
        
        // Update UI
        fileNameEl.textContent = file.name;
        fileNameEl.style.color = 'var(--accent-green)';
        fileSizeEl.textContent = formatFileSize(file.size);
        
        statusEl.textContent = '✓ Ready';
        statusEl.style.color = 'var(--accent-green)';
        
        showMessage(`✅ Selected: ${file.name} (${formatFileSize(file.size)})`, 'success');
        
        // Check if both files are loaded
        checkReadyToMerge();
    }
}

function checkReadyToMerge() {
    const file1 = fileInput1.files[0];
    const file2 = fileInput2.files[0];
    
    if (file1 && file2) {
        showMessage('⚡ Both files loaded! Click "Merge JSON Files" to continue', 'success');
        mergeBtn.focus();
    }
}

function showMessage(text, type = 'success') {
    const message = document.createElement('div');
    message.className = `message ${type}`;
    message.innerHTML = `
        <span>${type === 'success' ? '✅' : type === 'error' ? '❌' : '⚠️'}</span>
        <span>${text}</span>
    `;
    
    messages.appendChild(message);
    
    // Auto-remove message after 4 seconds
    setTimeout(() => {
        message.style.opacity = '0';
        message.style.transform = 'translateX(100%)';
        setTimeout(() => message.remove(), 300);
    }, 4000);
}

function showLoading(show) {
    loadingOverlay.style.display = show ? 'flex' : 'none';
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function mergeFiles() {
    const file1 = fileInput1.files[0];
    const file2 = fileInput2.files[0];
    
    if (!file1 || !file2) {
        showMessage('Please select both JSON files', 'error');
        return;
    }
    
    showLoading(true);
    
    Promise.all([
        readFileAsJson(file1),
        readFileAsJson(file2)
    ]).then(([json1, json2]) => {
        mergedJson = deepMerge(json1, json2);
        sortModelData(mergedJson);
        sortAlphabetically(false);
        
        updatePreview();
        updateStats();
        
        previewSection.style.display = 'block';
        statsSection.style.display = 'block';
        downloadBtn.disabled = false;
        
        showMessage('✅ JSON files merged successfully!', 'success');
    }).catch(error => {
        showMessage(`❌ Error: ${error.message}`, 'error');
    }).finally(() => {
        showLoading(false);
    });
}

function readFileAsJson(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const json = JSON.parse(e.target.result);
                if (!json || typeof json !== 'object') {
                    throw new Error('Invalid JSON structure');
                }
                resolve(json);
            } catch (error) {
                reject(new Error('Invalid JSON format'));
            }
        };
        reader.onerror = () => reject(new Error('Error reading file'));
        reader.readAsText(file);
    });
}

function deepMerge(obj1, obj2) {
    const result = JSON.parse(JSON.stringify(obj1));
    
    for (const key in obj2) {
        if (obj2.hasOwnProperty(key)) {
            if (result.hasOwnProperty(key) && 
                typeof result[key] === 'object' && 
                typeof obj2[key] === 'object' &&
                !Array.isArray(result[key]) && 
                !Array.isArray(obj2[key])) {
                result[key] = deepMerge(result[key], obj2[key]);
            } else if (result.hasOwnProperty(key) && 
                      Array.isArray(result[key]) && 
                      Array.isArray(obj2[key])) {
                const existingData = new Set(result[key].map(item => item.custom_model_data));
                const newItems = obj2[key].filter(item => !existingData.has(item.custom_model_data));
                result[key] = [...result[key], ...newItems];
            } else {
                result[key] = obj2[key];
            }
        }
    }
    
    return result;
}

function sortModelData(json) {
    if (json.items) {
        for (const itemType in json.items) {
            if (Array.isArray(json.items[itemType])) {
                json.items[itemType].sort((a, b) => {
                    // Handle missing custom_model_data
                    const aData = a.custom_model_data || 0;
                    const bData = b.custom_model_data || 0;
                    return aData - bData;
                });
            }
        }
    }
}

function sortAlphabetically(showNotification = true) {
    if (!mergedJson || !mergedJson.items) {
        if (showNotification) showMessage('No JSON data to sort', 'error');
        return;
    }
    
    const sortedItems = {};
    const keys = Object.keys(mergedJson.items).sort((a, b) => {
        const aKey = a.replace('minecraft:', '').toLowerCase();
        const bKey = b.replace('minecraft:', '').toLowerCase();
        return aKey.localeCompare(bKey);
    });
    
    keys.forEach(key => {
        sortedItems[key] = mergedJson.items[key];
    });
    
    mergedJson.items = sortedItems;
    isSorted = true;
    
    updatePreview();
    sortBadge.style.display = 'inline-block';
    
    if (showNotification) {
        showMessage('🔠 Items sorted alphabetically A-Z', 'success');
    }
}

function updatePreview() {
    if (!mergedJson) return;
    
    const jsonString = JSON.stringify(mergedJson, null, 2);
    const maxLength = 2000;
    const previewText = jsonString.length > maxLength ? 
        jsonString.substring(0, maxLength) + '\n...' : jsonString;
    
    // Simple syntax highlighting
    const highlighted = previewText
        .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?)/g, match => {
            if (/:$/.test(match)) {
                return `<span class="json-key">${match}</span>`;
            }
            return `<span class="json-string">${match}</span>`;
        })
        .replace(/\b(true|false)\b/g, '<span class="json-boolean">$1</span>')
        .replace(/\b(null)\b/g, '<span class="json-null">$1</span>')
        .replace(/\b\d+\b/g, '<span class="json-number">$&</span>');
    
    jsonPreview.innerHTML = highlighted;
}

function updateStats() {
    if (!mergedJson || !mergedJson.items) return;
    
    let totalItems = 0;
    const uniqueTypes = new Set();
    let totalNameLength = 0;
    let longestName = 0;
    let longestNameItem = '';
    
    for (const itemType in mergedJson.items) {
        uniqueTypes.add(itemType);
        
        if (Array.isArray(mergedJson.items[itemType])) {
            mergedJson.items[itemType].forEach(item => {
                totalItems++;
                if (item.name) {
                    const length = item.name.length;
                    totalNameLength += length;
                    if (length > longestName) {
                        longestName = length;
                        longestNameItem = item.name;
                    }
                }
            });
        }
    }
    
    totalItemsEl.textContent = totalItems.toLocaleString();
    uniqueTypesEl.textContent = uniqueTypes.size.toLocaleString();
    longestNameEl.textContent = `${longestName} chars`;
    avgLengthEl.textContent = totalItems > 0 ? 
        Math.round(totalNameLength / totalItems) + ' chars' : '0 chars';
    
    // Tooltip for longest name
    longestNameEl.title = longestNameItem || 'No names found';
}

function downloadJson() {
    if (!mergedJson) {
        showMessage('No JSON data to download', 'error');
        return;
    }
    
    const jsonStr = JSON.stringify(mergedJson, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:]/g, '-');
    const a = document.createElement('a');
    a.href = url;
    a.download = isSorted ? 
        `geyser_mappings_merged_sorted_${timestamp}.json` : 
        `geyser_mappings_merged_${timestamp}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showMessage('💾 JSON file downloaded successfully!', 'success');
}

function clearAll() {
    // Clear file inputs
    fileInput1.value = '';
    fileInput2.value = '';
    
    // Reset UI
    fileName1.textContent = 'No file selected';
    fileName2.textContent = 'No file selected';
    fileName1.style.color = '';
    fileName2.style.color = '';
    
    fileSize1.textContent = '';
    fileSize2.textContent = '';
    
    uploadStatus1.textContent = '';
    uploadStatus2.textContent = '';
    
    jsonPreview.innerHTML = '// Merged JSON will appear here';
    previewSection.style.display = 'none';
    statsSection.style.display = 'none';
    sortBadge.style.display = 'none';
    downloadBtn.disabled = true;
    
    // Reset variables
    mergedJson = null;
    isSorted = false;
    
    showMessage('🗑️ All data cleared', 'success');
}