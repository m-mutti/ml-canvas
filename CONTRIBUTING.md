# Contributing to ML Canvas

Thank you for your interest in contributing to ML Canvas! This project is designed to be the foundation for ML annotation tools, and we welcome contributions that help make it better for the machine learning community.

## How to Contribute

### Areas Where We Need Help

We're particularly looking for contributions in these areas:

#### 🎨 New Drawing Modes
- **Circle/Ellipse Tool**: For circular object detection
- **Line/Arrow Tool**: For directional annotations
- **Brush Tool**: For pixel-level segmentation
- **Keypoint Tool**: For pose estimation and landmark detection

#### 📊 Export Formats
- **COCO Format**: JSON export compatible with COCO dataset format
- **YOLO Format**: Text file export for YOLO training
- **Pascal VOC**: XML export for Pascal VOC format
- **Mask R-CNN**: Binary mask export for instance segmentation
- **Custom Formats**: Support for specific ML framework requirements

#### 🔧 ML Framework Integrations
- **TensorFlow.js**: Direct integration for in-browser training
- **PyTorch**: Export utilities for PyTorch datasets
- **Hugging Face**: Integration with Hugging Face datasets
- **Roboflow**: Direct upload to Roboflow projects

#### ⚡ Performance Optimizations
- **WebGL Rendering**: Hardware-accelerated drawing
- **Canvas Offloading**: Web Worker support for heavy operations
- **Memory Management**: Efficient handling of large images/datasets
- **Touch/Mobile Support**: Better mobile annotation experience

### Getting Started

1. **Fork the Repository**
   ```bash
   git clone https://github.com/yourusername/ml-canvas.git
   cd ml-canvas
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Run Tests**
   ```bash
   npm run test:unit
   ```

### Development Guidelines

#### Code Style
- Follow the existing Vue 3 Composition API patterns
- Use TypeScript for type safety where applicable
- Maintain separation between canvas operations and ML data formats
- Keep coordinate system transformations isolated and well-documented

#### Architecture Principles
- **Event-Driven**: Use Vue's reactive system and custom events
- **Modular**: Each drawing mode should be self-contained
- **Extensible**: Make it easy to add new tools and export formats
- **ML-First**: Always consider the end ML use case

#### Adding New Drawing Modes

When adding a new drawing mode, follow this pattern:

1. **Add mode to validator** in `drawingMode` prop
2. **Implement mouse handlers** for the new mode
3. **Create shape creation function** that returns both canvas and image coordinates
4. **Add preview drawing function** for real-time feedback
5. **Add redraw logic** for persisting shapes
6. **Update documentation** and examples

Example structure:
```javascript
// In handleMouseDown
else if (props.drawingMode === 'newmode') {
  // Initialize drawing state
}

// In handleMouseMove  
else if (props.drawingMode === 'newmode') {
  // Update preview
  redrawCanvas()
  drawNewModePreview()
}

// In handleMouseUp
else if (props.drawingMode === 'newmode') {
  const shape = createNewModeShape()
  if (shape) {
    drawnShapes.value.push(shape)
    emit('shape-created', shape)
    redrawCanvas()
  }
}
```

#### Testing Requirements

- **Unit Tests**: Test shape creation logic and coordinate transformations
- **Integration Tests**: Test drawing interactions and events
- **Visual Tests**: Ensure drawing modes work correctly across browsers
- **Performance Tests**: Verify performance with large datasets

#### Documentation

When contributing, please:
- Update the README if adding user-facing features
- Add JSDoc comments for new functions
- Include usage examples for new drawing modes
- Update the API reference table

### Submitting Changes

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/new-drawing-mode
   ```

2. **Make Changes**
   - Write code following the guidelines above
   - Add tests for new functionality
   - Update documentation

3. **Test Your Changes**
   ```bash
   npm run test:unit
   npm run lint
   ```

4. **Commit Changes**
   ```bash
   git commit -m "feat: add circle drawing mode for object detection"
   ```

5. **Push and Create PR**
   ```bash
   git push origin feature/new-drawing-mode
   ```

### Pull Request Guidelines

#### PR Title Format
Use conventional commits format:
- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation changes
- `perf:` for performance improvements
- `refactor:` for code refactoring

#### PR Description Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] New drawing mode
- [ ] Export format
- [ ] Bug fix
- [ ] Performance improvement
- [ ] Documentation update

## ML Use Case
Describe how this helps with ML annotation tasks

## Testing
- [ ] Unit tests added/updated
- [ ] Manual testing completed
- [ ] Cross-browser testing done

## Screenshots
If applicable, add screenshots showing the new functionality
```

### Code Review Process

1. **Automated Checks**: All PRs must pass linting and tests
2. **Functionality Review**: Ensure the feature works as intended
3. **Architecture Review**: Check that changes follow project patterns
4. **ML Relevance**: Verify the contribution helps ML annotation workflows
5. **Documentation**: Ensure adequate documentation is provided

### Community

- **Discussions**: Use GitHub Discussions for feature requests and questions
- **Issues**: Use GitHub Issues for bug reports and specific tasks
- **Discord**: Join our community Discord for real-time discussions

### Recognition

Contributors will be:
- Listed in the project's contributors section
- Mentioned in release notes for significant contributions
- Invited to join the core contributor team for ongoing contributors

## ML-Specific Contribution Ideas

### Dataset Integration Examples
- **Medical Imaging**: DICOM image support with specialized annotation tools
- **Autonomous Vehicles**: Road segmentation and object detection tools
- **Retail**: Product bounding box and category annotation
- **Manufacturing**: Defect detection and quality control annotations

### Research Applications
- **Active Learning**: Integration with uncertainty sampling
- **Semi-Supervised Learning**: Tools for pseudo-labeling workflows
- **Crowdsourcing**: Multi-annotator consensus and quality control
- **Synthetic Data**: Tools for augmenting training datasets

Thank you for helping make ML Canvas the best annotation tool for the machine learning community!