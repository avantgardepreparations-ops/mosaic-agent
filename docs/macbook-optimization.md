# MacBook Pro 2015 Optimization Guide

## Hardware Specifications
- **Model**: MacBook Pro 13" Retina (Early 2015)
- **OS**: macOS 12.7.6 (Monterey)
- **RAM**: 8 GB
- **CPU**: Intel Core i5/i7 (No dedicated GPU)

## Recommended AI Tools Configuration

### ✅ Highly Compatible Tools

#### Ollama
- **Recommended Models**: 
  - `tinyllama:1.1b` (Very fast)
  - `llama2:7b-chat-q4_0` (Balanced)
  - `mistral:7b-instruct-q4_0` (Good quality)
- **Configuration**:
  ```bash
  # Download quantized models
  ollama pull tinyllama:1.1b
  ollama pull llama2:7b-chat-q4_0
  
  # Check model size
  ollama list
  ```

#### Whisper.cpp
- **Model Size**: Use `base` or `small` models
- **Performance**: ~2-3x real-time on your CPU
- **Configuration**:
  ```bash
  # Download optimized model
  whisper --model base --language fr audio.wav
  ```

#### ChromaDB
- **Memory Usage**: ~100-500MB depending on collection size
- **Performance**: Very good for document indexing
- **Tip**: Use persistent storage for better performance

#### LangChain
- **Memory Usage**: Minimal (Python library)
- **Performance**: Excellent
- **Tip**: Combine with Ollama for local LLM chains

### ⚠️ Limited Performance Tools

#### Stable Diffusion
- **Issue**: Very slow on CPU (5-10 minutes per image)
- **Solution**: Use cloud services or reduce image size
- **Alternative**: Use online services like Replicate or Hugging Face Spaces

#### Large Language Models (>7B)
- **Issue**: Insufficient RAM for models >7B parameters
- **Solution**: Use quantized versions or cloud APIs
- **Recommendation**: Stick to 2-4B parameter models

## Performance Optimization Tips

### Memory Management
```bash
# Monitor memory usage
htop

# Close unnecessary applications
# Keep available RAM > 2GB for AI tools
```

### CPU Optimization
```bash
# Set CPU affinity for intensive tasks
taskset -c 0-3 python your_ai_script.py

# Use all CPU cores for compilation
export MAKEFLAGS="-j4"
```

### Storage Optimization
```bash
# Create dedicated directory for AI models
mkdir -p ~/ai-models
export MODELS_PATH=~/ai-models

# Use SSD for better I/O performance
# Ensure 10GB+ free space
```

## Recommended Workflow

1. **Start with Ollama + TinyLLaMA** for quick responses
2. **Use ChromaDB** for document indexing and retrieval
3. **Implement LangChain** for complex AI workflows
4. **Use Whisper** for voice input
5. **Offload heavy tasks** to cloud when needed

## Cloud Hybrid Approach

For resource-intensive tasks:

### Recommended Cloud Services
- **RunPod**: GPU instances for Stable Diffusion
- **Google Colab**: Free GPU for experimentation
- **Hugging Face Spaces**: Pre-built AI applications
- **Replicate**: API for various AI models

### Local vs Cloud Decision Matrix
| Task | Local | Cloud | Reasoning |
|------|--------|--------|-----------|
| Text Generation (2-4B) | ✅ | ❌ | Good performance locally |
| Text Generation (7B+) | ⚠️ | ✅ | Limited by RAM |
| Voice Transcription | ✅ | ❌ | Whisper works great |
| Image Generation | ❌ | ✅ | Too slow on CPU |
| Fine-tuning | ❌ | ✅ | Requires GPU |
| Document Search | ✅ | ❌ | ChromaDB/FAISS sufficient |

## Troubleshooting

### Common Issues

**Ollama not starting**
```bash
# Check if port is available
lsof -i :11434

# Restart Ollama
brew services restart ollama
```

**Out of memory errors**
```bash
# Check available memory
free -h

# Close memory-intensive applications
# Use swap if necessary (not recommended for AI)
```

**Slow performance**
```bash
# Check CPU usage
top

# Reduce model size
ollama pull tinyllama:1.1b  # Smaller model

# Use quantized models
ollama pull llama2:7b-chat-q4_0  # Quantized version
```

## Performance Benchmarks

### Text Generation (Ollama)
- **TinyLLaMA 1.1B**: ~50 tokens/second
- **LLaMA2 7B Q4**: ~8-12 tokens/second
- **Mistral 7B Q4**: ~10-15 tokens/second

### Voice Transcription (Whisper)
- **Base model**: ~2-3x real-time
- **Small model**: ~3-4x real-time
- **Tiny model**: ~5-6x real-time

### Memory Usage
- **Ollama (TinyLLaMA)**: ~1-2GB RAM
- **Ollama (7B Q4)**: ~4-6GB RAM
- **ChromaDB**: ~100-500MB RAM
- **Whisper**: ~1-2GB RAM during transcription