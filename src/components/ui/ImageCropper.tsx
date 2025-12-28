'use client';

import * as React from 'react';
import { useState, useRef, useCallback, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, RotateCw, Check } from 'lucide-react';
import { Button } from './Button';

interface ImageCropperProps {
  imageFile: File;
  onCrop: (croppedBlob: Blob) => void;
  onCancel: () => void;
  aspectRatio?: number; // 1 for 1:1 square
}

interface CropArea {
  x: number;
  y: number;
  size: number;
}

export function ImageCropper({
  imageFile,
  onCrop,
  onCancel,
  aspectRatio = 1,
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

  // Load image from file
  useEffect(() => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setImageSrc(e.target?.result as string);
    };
    reader.readAsDataURL(imageFile);
  }, [imageFile]);

  // Load image element
  useEffect(() => {
    if (!imageSrc) return;

    const img = new Image();
    img.onload = () => {
      setImageElement(img);
      setImageLoaded(true);

      // Calculate initial zoom to fit image
      if (containerRef.current) {
        const containerSize = Math.min(
          containerRef.current.clientWidth,
          containerRef.current.clientHeight
        );
        const imageSize = Math.max(img.width, img.height);
        const initialZoom = containerSize / imageSize;
        setZoom(Math.max(initialZoom, 0.5));
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

  // Handle zoom
  const handleZoom = useCallback((delta: number) => {
    setZoom((prev) => Math.max(0.5, Math.min(3, prev + delta)));
  }, []);

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

    // Output size (we'll use 1024 as max, server will resize)
    const outputSize = 1024;
    canvas.width = outputSize;
    canvas.height = outputSize;

    // Calculate crop area
    const containerRect = containerRef.current.getBoundingClientRect();
    const cropSize = Math.min(containerRect.width, containerRect.height) * 0.8;
    const cropX = (containerRect.width - cropSize) / 2;
    const cropY = (containerRect.height - cropSize) / 2;

    // Clear canvas
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, outputSize, outputSize);

    // Calculate source coordinates
    const scale = outputSize / cropSize;
    const scaledZoom = zoom * scale;

    // Center of crop area in image coordinates
    const centerX = (cropX + cropSize / 2 - position.x) / zoom;
    const centerY = (cropY + cropSize / 2 - position.y) / zoom;

    ctx.save();
    ctx.translate(outputSize / 2, outputSize / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(scaledZoom, scaledZoom);
    ctx.translate(-centerX, -centerY);
    ctx.drawImage(imageElement, 0, 0);
    ctx.restore();

    // Convert to blob
    canvas.toBlob(
      (blob) => {
        if (blob) {
          onCrop(blob);
        }
      },
      'image/jpeg',
      0.95
    );
  }, [imageElement, zoom, rotation, position, onCrop]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden max-w-lg w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">برش تصویر</h3>
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
          className="relative w-full aspect-square bg-gray-100 dark:bg-gray-800 overflow-hidden cursor-move"
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
          {imageSrc && (
            <div
              className="absolute"
              style={{
                transform: `translate(${position.x}px, ${position.y}px) rotate(${rotation}deg) scale(${zoom})`,
                transformOrigin: 'center center',
              }}
            >
              <img
                src={imageSrc}
                alt="Crop preview"
                className="max-w-none"
                draggable={false}
              />
            </div>
          )}

          {/* Crop overlay */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Dark corners */}
            <div className="absolute inset-0 bg-black/50" />

            {/* Clear center (crop area) */}
            <div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-transparent border-2 border-white rounded-full"
              style={{
                width: '80%',
                height: '80%',
                boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)',
              }}
            />

            {/* Grid lines */}
            <div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 border border-white/30"
              style={{ width: '80%', height: '80%' }}
            >
              <div className="absolute left-1/3 top-0 bottom-0 border-l border-white/30" />
              <div className="absolute right-1/3 top-0 bottom-0 border-l border-white/30" />
              <div className="absolute top-1/3 left-0 right-0 border-t border-white/30" />
              <div className="absolute bottom-1/3 left-0 right-0 border-t border-white/30" />
            </div>
          </div>

          {/* Loading state */}
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="p-4 border-t space-y-4">
          {/* Zoom slider */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleZoom(-0.2)}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <ZoomOut className="w-5 h-5" />
            </button>

            <input
              type="range"
              min="0.5"
              max="3"
              step="0.1"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="flex-1 h-2 bg-muted rounded-lg appearance-none cursor-pointer"
            />

            <button
              onClick={() => handleZoom(0.2)}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <ZoomIn className="w-5 h-5" />
            </button>

            <button
              onClick={handleRotate}
              className="p-2 rounded-lg hover:bg-muted transition-colors mr-2"
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
