'use client';

import * as React from 'react';
import { useState, useRef, useCallback, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, RotateCw, Check } from 'lucide-react';
import { Button } from './Button';

interface ImageCropperProps {
  imageFile: File;
  onCrop: (croppedBlob: Blob) => void;
  onCancel: () => void;
  aspectRatio?: number;
}

export function ImageCropper({
  imageFile,
  onCrop,
  onCancel,
}: ImageCropperProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [imageSrc, setImageSrc] = useState<string>('');
  const [imageLoaded, setImageLoaded] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageElement, setImageElement] = useState<HTMLImageElement | null>(null);
  const [containerSize, setContainerSize] = useState(300);

  // Load image from file
  useEffect(() => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setImageSrc(e.target?.result as string);
    };
    reader.readAsDataURL(imageFile);
  }, [imageFile]);

  // Load image element and center it
  useEffect(() => {
    if (!imageSrc) return;

    const img = new Image();
    img.onload = () => {
      setImageElement(img);
      setImageLoaded(true);

      if (containerRef.current) {
        const contSize = containerRef.current.clientWidth;
        setContainerSize(contSize);

        // Calculate initial zoom to fill the crop circle (80% of container)
        const cropDiameter = contSize * 0.8;
        const minDimension = Math.min(img.width, img.height);
        const initialZoom = cropDiameter / minDimension;

        setZoom(Math.max(initialZoom, 0.5));

        // Center the image
        setPosition({
          x: (contSize - img.width * initialZoom) / 2,
          y: (contSize - img.height * initialZoom) / 2,
        });
      }
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // Handle mouse/touch drag
  const handleMouseDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(true);

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    setDragStart({
      x: clientX - position.x,
      y: clientY - position.y,
    });
  }, [position]);

  const handleMouseMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    setPosition({
      x: clientX - dragStart.x,
      y: clientY - dragStart.y,
    });
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Handle zoom with re-centering
  const handleZoom = useCallback((delta: number) => {
    setZoom((prev) => {
      const newZoom = Math.max(0.3, Math.min(4, prev + delta));

      // Re-center after zoom
      if (imageElement && containerRef.current) {
        const contSize = containerRef.current.clientWidth;
        const centerX = contSize / 2;
        const centerY = contSize / 2;

        // Calculate current center of image
        const currentCenterX = position.x + (imageElement.width * prev) / 2;
        const currentCenterY = position.y + (imageElement.height * prev) / 2;

        // Calculate offset from container center
        const offsetX = centerX - currentCenterX;
        const offsetY = centerY - currentCenterY;

        // Adjust position to maintain center point
        const zoomRatio = newZoom / prev;
        setPosition({
          x: position.x - (imageElement.width * (newZoom - prev)) / 2 + offsetX * (1 - zoomRatio),
          y: position.y - (imageElement.height * (newZoom - prev)) / 2 + offsetY * (1 - zoomRatio),
        });
      }

      return newZoom;
    });
  }, [imageElement, position]);

  // Handle rotation
  const handleRotate = useCallback(() => {
    setRotation((prev) => (prev + 90) % 360);
  }, []);

  // Handle wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    handleZoom(delta);
  }, [handleZoom]);

  // Crop image
  const handleCrop = useCallback(() => {
    if (!canvasRef.current || !imageElement || !containerRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Output size
    const outputSize = 1024;
    canvas.width = outputSize;
    canvas.height = outputSize;

    // Crop circle parameters (80% of container)
    const cropDiameter = containerSize * 0.8;
    const cropRadius = cropDiameter / 2;
    const cropCenterX = containerSize / 2;
    const cropCenterY = containerSize / 2;

    // Clear canvas with white background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, outputSize, outputSize);

    // Calculate scale factor
    const scale = outputSize / cropDiameter;

    // Save context and set up clipping (circular crop)
    ctx.save();
    ctx.beginPath();
    ctx.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    // Calculate where to draw the image
    // The crop area is centered in the container
    // We need to figure out what part of the scaled/positioned image falls within the crop circle

    const imgScaledWidth = imageElement.width * zoom;
    const imgScaledHeight = imageElement.height * zoom;

    // Position of crop circle's top-left corner relative to container
    const cropLeft = cropCenterX - cropRadius;
    const cropTop = cropCenterY - cropRadius;

    // Where is the image relative to the crop circle?
    const imgRelativeX = position.x - cropLeft;
    const imgRelativeY = position.y - cropTop;

    // Handle rotation
    ctx.translate(outputSize / 2, outputSize / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-outputSize / 2, -outputSize / 2);

    // Draw image scaled to output size
    ctx.drawImage(
      imageElement,
      imgRelativeX * scale,
      imgRelativeY * scale,
      imgScaledWidth * scale,
      imgScaledHeight * scale
    );

    ctx.restore();

    // Convert to blob
    canvas.toBlob(
      (blob) => {
        if (blob) {
          onCrop(blob);
        }
      },
      'image/jpeg',
      0.92
    );
  }, [imageElement, zoom, rotation, position, containerSize, onCrop]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">برش تصویر پروفایل</h3>
          <button
            onClick={onCancel}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Crop Area */}
        <div
          ref={containerRef}
          className="relative w-full aspect-square bg-gray-900 overflow-hidden cursor-move select-none"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleMouseDown}
          onTouchMove={handleMouseMove}
          onTouchEnd={handleMouseUp}
          onWheel={handleWheel}
        >
          {/* Image */}
          {imageSrc && imageLoaded && (
            <img
              src={imageSrc}
              alt="Crop preview"
              className="absolute max-w-none pointer-events-none"
              style={{
                left: position.x,
                top: position.y,
                width: imageElement ? imageElement.width * zoom : 'auto',
                height: imageElement ? imageElement.height * zoom : 'auto',
                transform: `rotate(${rotation}deg)`,
                transformOrigin: 'center center',
              }}
              draggable={false}
            />
          )}

          {/* Crop overlay - dark outside, clear inside circle */}
          <div className="absolute inset-0 pointer-events-none">
            <svg className="w-full h-full">
              <defs>
                <mask id="cropMask">
                  <rect width="100%" height="100%" fill="white" />
                  <circle cx="50%" cy="50%" r="40%" fill="black" />
                </mask>
              </defs>
              <rect
                width="100%"
                height="100%"
                fill="rgba(0,0,0,0.6)"
                mask="url(#cropMask)"
              />
              <circle
                cx="50%"
                cy="50%"
                r="40%"
                fill="none"
                stroke="white"
                strokeWidth="2"
              />
            </svg>
          </div>

          {/* Loading state */}
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="p-4 border-t space-y-4">
          {/* Zoom slider */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleZoom(-0.15)}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <ZoomOut className="w-5 h-5" />
            </button>

            <input
              type="range"
              min="0.3"
              max="4"
              step="0.05"
              value={zoom}
              onChange={(e) => {
                const newZoom = parseFloat(e.target.value);
                if (imageElement && containerRef.current) {
                  const contSize = containerRef.current.clientWidth;
                  // Recenter on zoom change from slider
                  setPosition({
                    x: (contSize - imageElement.width * newZoom) / 2,
                    y: (contSize - imageElement.height * newZoom) / 2,
                  });
                }
                setZoom(newZoom);
              }}
              className="flex-1 h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
            />

            <button
              onClick={() => handleZoom(0.15)}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <ZoomIn className="w-5 h-5" />
            </button>

            <div className="w-px h-6 bg-border mx-1" />

            <button
              onClick={handleRotate}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <RotateCw className="w-5 h-5" />
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={onCancel} className="flex-1">
              انصراف
            </Button>
            <Button onClick={handleCrop} className="flex-1">
              <Check className="w-4 h-4 ml-2" />
              تایید
            </Button>
          </div>
        </div>

        {/* Hidden canvas for cropping */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
}
