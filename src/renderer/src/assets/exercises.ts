import { ExerciseData } from '@renderer/types'

export const BASIC_EXERCISES: Array<ExerciseData> = [
  {
    name: 'Squat',
    difficulty: 'BASIC',
    explanation: `

A squat is a lower-body exercise that strengthens the legs, hips, and core. During a squat, you bend your knees and lower your hips as if sitting in a chair, then return to a standing position. 

**Common Pain Areas Caused by Wrong Squat Form**

1\. Knee Pain   
2\. Lower Back Pain   
3\. Hip Pain   
4\. Ankle Pain   
5\. Groin Pain

**Tips to Prevent Pain**

1\. Warm up before exercising  
2\. Improve ankle and hip mobility  
3\. Strengthen core muscles  
4\. Start with bodyweight squats before adding weight  
5\. Practice proper technique slowly  
6\. Stop if you feel sharp pain`,
    exerciseId: 'squat',
    thumbnailSrc: './assets/images/squat.png',
    videoSrc: 'https://www.youtube.com/embed/d_xB-41ieqw'
  },
  {
    name: 'Plank',
    difficulty: 'BASIC',
    explanation: `
  A plank is a core-strengthening exercise that helps improve stability, balance, posture, and overall body strength. It is performed by holding the body in a straight line while supporting yourself on the forearms or hands and toes.
  
  **Common Pain Areas Caused by Wrong Plank Form**  
  
  1\. Lower Back Pain  
  2\. Shoulder Pain  
  3\. Neck Pain  
  4\. Wrist Pain  
  5\. Hip Pain  
  6\. Elbow Pain
  
  **Tips for a Safe and Effective Plank**
  
  1. Engage your core throughout the movement
  2. Avoid arching or sagging your lower back
  3. Keep your neck relaxed and aligned with your spine
  4. Start with shorter holding times if you are a beginner
  5. Focus on proper form instead of long duration
  6. Breathe normally and avoid holding your breath
  7. Stop if you feel sharp pain in the back, shoulders, or wrists
  8. Practice regularly to improve endurance and stability`,
    exerciseId: 'plank',
    thumbnailSrc: './assets/images/plank.png',
    videoSrc: 'https://www.youtube.com/embed/v_8rMn6jxqc'
  },
  {
    soon: true,
    difficulty: 'BASIC',
    name: 'Glute bridge',
    thumbnailSrc: './assets/images/glute-bridge.png'
  }
]

export const INTERMEDIATE_EXERCISES: Array<ExerciseData> = [
  {
    name: 'Downward Facing Dog',
    difficulty: 'INTERMEDIATE',
    explanation: `
Downward Facing Dog is a popular yoga pose that stretches and strengthens the whole body, especially the shoulders, back, hamstrings, and calves. In this pose, the body forms an inverted “V” shape.

**Common Pain Areas Caused by Wrong Downward Facing Dog Form**  
1\. Wrist Pain  
2\. Shoulder Pain  
3\. Lower Back Pain  
4\. Neck Pain

**Tips for a Safe and Effective Downward Facing Dog**

1. Bend your knees slightly if hamstrings feel tight
2. Keep your back straight instead of forcing heels to touch the floor
3. Spread fingers wide for better balance and support
4. Engage your core muscles to support the spine
5. Avoid shrugging the shoulders toward the ears
6. Breathe slowly and steadily during the pose
7. Warm up wrists and shoulders before practice
8. Stop if you feel sharp pain in the wrists, shoulders, or lower back
`,
    exerciseId: 'INT-01',
    thumbnailSrc: './assets/images/downward-dog.png',
    videoSrc: 'https://www.youtube.com/embed/p146rICRJkg'
  },
  {
    soon: true,
    name: 'Lunge',
    difficulty: 'INTERMEDIATE',
    thumbnailSrc: './assets/images/lunge.png'
  },
  {
    soon: true,
    name: 'Side Plank',
    difficulty: 'INTERMEDIATE',
    thumbnailSrc: './assets/images/side-plank.png'
  }
]

export const ADVANCED_EXERCISES: Array<ExerciseData> = [
  {
    soon: true,
    difficulty: 'ADVANCED',
    name: 'Pistol Squat',
    thumbnailSrc: './assets/images/pistol-squat.png'
  },
  {
    soon: true,
    difficulty: 'ADVANCED',
    name: 'Crow pose',
    thumbnailSrc: './assets/images/crow-pose.png'
  },
  {
    soon: true,
    difficulty: 'ADVANCED',
    name: 'Handstand',
    thumbnailSrc: './assets/images/handstand.png'
  }
]
