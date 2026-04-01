import { HandLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

let vision: any = null;
let handLandmarker: HandLandmarker | null = null;
let initializing = false;

export async function getHandLandmarker(): Promise<HandLandmarker> {
  if (handLandmarker) return handLandmarker;
  
  if (initializing) {
    // Wait for existing initialization
    while (initializing) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    if (handLandmarker) return handLandmarker;
  }

  initializing = true;
  try {
    if (!vision) {
      vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );
    }
    
    try {
      handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
          delegate: "GPU"
        },
        runningMode: "VIDEO",
        numHands: 2
      });
    } catch (gpuError) {
      console.warn("GPU delegate failed, falling back to CPU:", gpuError);
      handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
          delegate: "CPU"
        },
        runningMode: "VIDEO",
        numHands: 2
      });
    }
    
    return handLandmarker;
  } finally {
    initializing = false;
  }
}
