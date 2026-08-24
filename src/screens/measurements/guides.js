// screens/measurements/guides.js
// Single source of truth for the measurement workspace: every body field with
// its tutorial content, validation range, unit type and grouping.
//
// Field KEYS are a shared contract — the saved `data` blob is read by
// StyleOrderPage, ProductDetails, AppointmentDetails and OrderDetails, and some
// keys are hardcoded there. Do not rename a key without updating those screens.
//
// Ranges are always in CENTIMETRES (kilograms for weight); that is the canonical
// stored unit. `typical` is the everyday adult band used for a soft "double
// check" warning; `min`/`max` are the hard bounds that block a save.

export const GUIDES = {
  // -------------------------------------------------------------- core fit
  chest: {
    group: 'core', label: 'Chest', unit: 'length', required: true,
    figure: 'torso',
    intro: 'The single most important measurement for jackets, shirts and dresses.',
    range: { min: 50, max: 160, typical: [76, 127] },
    steps: [
      'Wrap the tape around the fullest part of the chest, under the arms.',
      'Keep the tape level and parallel to the floor across the back.',
      'Breathe normally and read the value on a relaxed out-breath.',
    ],
    mistakes: [
      'Pulling the tape too tight — it should sit snug, not compress.',
      'Letting the tape ride up at the back.',
    ],
    needs: ['tape', 'mirror'],
  },
  waist: {
    group: 'core', label: 'Natural waist', unit: 'length', required: true,
    figure: 'torso',
    intro: 'The narrowest part of the torso — not where trousers usually sit.',
    range: { min: 40, max: 160, typical: [58, 120] },
    steps: [
      'Find the narrowest point of the torso, usually just above the navel.',
      'Wrap the tape around it, keeping it level all the way round.',
      'Read the value without holding your breath or pulling the stomach in.',
    ],
    mistakes: [
      'Measuring at the trouser line instead of the natural waist.',
      'Sucking the stomach in — measure relaxed.',
    ],
    needs: ['tape', 'mirror'],
  },
  hips: {
    group: 'core', label: 'Hips and seat', unit: 'length', required: true,
    figure: 'torso',
    intro: 'The fullest point below the waist — critical for trousers and skirts.',
    range: { min: 50, max: 175, typical: [80, 130] },
    steps: [
      'Stand with feet together.',
      'Wrap the tape around the fullest part of the hips and seat.',
      'Check in a mirror that the tape is level front to back.',
    ],
    mistakes: [
      'Standing with feet apart, which widens the reading.',
      'Missing the fullest point — it is often lower than expected.',
    ],
    needs: ['tape', 'mirror'],
  },
  shoulder: {
    group: 'core', label: 'Shoulder width', unit: 'length', required: true,
    figure: 'torso',
    intro: 'Sets where the shoulder seam lands. A helper makes this far easier.',
    range: { min: 25, max: 65, typical: [36, 52] },
    steps: [
      'Measure across the back from one shoulder bone to the other.',
      'Follow the natural curve of the upper back, not a straight line.',
      'Keep both arms relaxed at the sides.',
    ],
    mistakes: [
      'Measuring in a straight line instead of over the curve.',
      'Rounding the shoulders forward during the measurement.',
    ],
    needs: ['tape', 'helper'],
  },
  neck: {
    group: 'core', label: 'Neck', unit: 'length', required: true,
    figure: 'neck',
    intro: 'Where a collar sits. Leave breathing room.',
    range: { min: 25, max: 60, typical: [30, 46] },
    steps: [
      'Wrap the tape around the base of the neck where a collar would rest.',
      'Angle it slightly lower at the front, as a shirt collar sits.',
      'Leave room for one finger beneath the tape.',
    ],
    mistakes: [
      'Measuring too high up the neck.',
      'Pulling tight with no room for a finger.',
    ],
    needs: ['tape'],
  },

  // ------------------------------------------------------------- upper body
  bust: {
    group: 'upper', label: 'Bust', unit: 'length',
    figure: 'torso',
    intro: 'The fullest point of the bust — used instead of chest for fitted womenswear.',
    range: { min: 50, max: 170, typical: [76, 127] },
    steps: [
      'Wear the undergarment intended for the finished outfit.',
      'Wrap the tape around the fullest part of the bust.',
      'Keep it level across the back and read on a relaxed out-breath.',
    ],
    mistakes: [
      'Measuring without the intended bra, which changes the shape.',
      'Letting the tape sag below the fullest point.',
    ],
    needs: ['tape', 'mirror'],
  },
  back_width: {
    group: 'upper', label: 'Back width', unit: 'length',
    figure: 'torso',
    intro: 'Across the shoulder blades — governs movement room in the back.',
    range: { min: 25, max: 60, typical: [32, 50] },
    steps: [
      'Measure straight across the back from one arm crease to the other.',
      'Keep the line level across the shoulder blades.',
      'Let both arms hang relaxed at the sides.',
    ],
    mistakes: [
      'Flexing or pulling the shoulders back.',
      'Measuring too high, near the shoulder seam.',
    ],
    needs: ['tape', 'helper'],
  },
  front_length: {
    group: 'upper', label: 'Front length', unit: 'length',
    figure: 'torso',
    intro: 'Shoulder to the intended hem, over the front of the body.',
    range: { min: 30, max: 90, typical: [38, 70] },
    steps: [
      'Start at the high shoulder point, next to the neck.',
      'Run the tape down over the chest or bust to the intended hem.',
      'Let the tape follow the body without pulling it straight.',
    ],
    mistakes: [
      'Pulling the tape into a straight line off the body.',
      'Guessing the hem — decide where the garment should end first.',
    ],
    needs: ['tape', 'mirror'],
  },
  shoulder_to_waist: {
    group: 'upper', label: 'Shoulder to waist', unit: 'length',
    figure: 'torso',
    intro: 'Vertical distance that positions the waist seam.',
    range: { min: 25, max: 65, typical: [36, 52] },
    steps: [
      'Start at the high shoulder point, next to the neck.',
      'Run the tape down over the fullest part of the chest or bust.',
      'Stop at the natural waist.',
    ],
    mistakes: [
      'Skipping over the chest and measuring a flat straight line.',
      'Ending at the trouser line instead of the natural waist.',
    ],
    needs: ['tape', 'mirror'],
  },
  arm_length: {
    group: 'upper', label: 'Arm length', unit: 'length',
    figure: 'arm',
    intro: 'Shoulder to wrist with the elbow bent — prevents short sleeves.',
    range: { min: 40, max: 80, typical: [52, 68] },
    steps: [
      'Bend the arm slightly, hand on the hip.',
      'Measure from the shoulder point, around the elbow, to the wrist bone.',
      'Keep the tape following the outside of the arm.',
    ],
    mistakes: [
      'Measuring a straight arm — the sleeve ends up too short.',
      'Stopping above the wrist bone.',
    ],
    needs: ['tape', 'helper'],
  },
  sleeve_length: {
    group: 'upper', label: 'Sleeve length', unit: 'length',
    figure: 'arm',
    intro: 'Centre back neck, over the shoulder, to the wrist — for shirts and coats.',
    range: { min: 55, max: 100, typical: [72, 92] },
    steps: [
      'Start at the centre of the back of the neck.',
      'Run the tape across the shoulder and down the slightly bent arm.',
      'Finish at the wrist bone.',
    ],
    mistakes: [
      'Straightening the arm midway through.',
      'Starting at the shoulder instead of the centre back neck.',
    ],
    needs: ['tape', 'helper'],
  },
  bicep: {
    group: 'upper', label: 'Bicep', unit: 'length',
    figure: 'arm',
    intro: 'The fullest part of the upper arm — sets the sleeve width.',
    range: { min: 15, max: 60, typical: [24, 40] },
    steps: [
      'Relax the arm at the side.',
      'Wrap the tape around the fullest part of the upper arm.',
      'Keep one finger under the tape for ease.',
    ],
    mistakes: [
      'Flexing the muscle, which inflates the reading.',
      'Measuring too close to the elbow.',
    ],
    needs: ['tape'],
  },
  wrist: {
    group: 'upper', label: 'Wrist', unit: 'length',
    figure: 'arm',
    intro: 'Sets the cuff. Measure over the wrist bone.',
    range: { min: 10, max: 25, typical: [14, 19] },
    steps: [
      'Wrap the tape around the wrist, over the wrist bone.',
      'Keep it snug but not tight.',
      'Read the value with the hand relaxed.',
    ],
    mistakes: [
      'Measuring below the wrist bone toward the hand.',
      'Pulling tight — allow for a comfortable cuff.',
    ],
    needs: ['tape'],
  },

  // ------------------------------------------------------------- lower body
  inseam: {
    group: 'lower', label: 'Inseam', unit: 'length',
    figure: 'leg',
    intro: 'Inside leg from crotch to hem — the key trouser length.',
    range: { min: 50, max: 100, typical: [68, 86] },
    steps: [
      'Stand straight and barefoot.',
      'Measure from the crotch seam down the inside of the leg.',
      'Stop at the desired hem, usually the ankle bone.',
    ],
    mistakes: [
      'Taking this alone — a helper is far more accurate.',
      'Wearing shoes, which changes the hem point.',
    ],
    needs: ['tape', 'helper'],
  },
  outseam: {
    group: 'lower', label: 'Outseam', unit: 'length',
    figure: 'leg',
    intro: 'Waist to hem down the outside of the leg.',
    range: { min: 70, max: 130, typical: [96, 112] },
    steps: [
      'Stand straight and barefoot.',
      'Measure from the natural waist down the outside of the leg.',
      'Finish at the desired hem.',
    ],
    mistakes: [
      'Starting at the hip instead of the natural waist.',
      'Letting the tape bow away from the leg.',
    ],
    needs: ['tape', 'helper'],
  },
  thigh: {
    group: 'lower', label: 'Thigh', unit: 'length',
    figure: 'leg',
    intro: 'The fullest part of the upper leg.',
    range: { min: 30, max: 90, typical: [46, 66] },
    steps: [
      'Stand with weight even on both feet.',
      'Wrap the tape around the fullest part of the upper thigh.',
      'Keep the tape level.',
    ],
    mistakes: [
      'Shifting weight onto one leg.',
      'Measuring too low, toward the knee.',
    ],
    needs: ['tape'],
  },
  knee: {
    group: 'lower', label: 'Knee', unit: 'length',
    figure: 'leg',
    intro: 'Around the centre of the knee, for tapered and fitted legs.',
    range: { min: 25, max: 60, typical: [33, 45] },
    steps: [
      'Stand with the leg relaxed and straight.',
      'Wrap the tape around the centre of the kneecap.',
      'Do not lock or bend the knee.',
    ],
    mistakes: [
      'Bending the knee, which changes the shape.',
      'Measuring above or below the kneecap.',
    ],
    needs: ['tape'],
  },
  calf: {
    group: 'lower', label: 'Calf', unit: 'length',
    figure: 'leg',
    intro: 'The fullest part of the lower leg.',
    range: { min: 20, max: 60, typical: [30, 44] },
    steps: [
      'Stand with weight even on both feet.',
      'Find the fullest part of the calf and wrap the tape around it.',
      'Move the tape slightly up and down to confirm the widest point.',
    ],
    mistakes: [
      'Standing on tiptoe, which flexes the calf.',
      'Guessing the widest point instead of checking it.',
    ],
    needs: ['tape'],
  },
  ankle: {
    group: 'lower', label: 'Ankle', unit: 'length',
    figure: 'leg',
    intro: 'Just above the ankle bone — sets the trouser opening.',
    range: { min: 15, max: 40, typical: [20, 28] },
    steps: [
      'Wrap the tape around the ankle just above the ankle bone.',
      'Keep it level around the joint.',
      'For trousers, also consider the hem opening you want.',
    ],
    mistakes: [
      'Measuring over the ankle bone rather than just above it.',
      'Pulling tight — leave room to pass a foot through.',
    ],
    needs: ['tape'],
  },
  waist_to_knee: {
    group: 'lower', label: 'Waist to knee', unit: 'length',
    figure: 'leg',
    intro: 'Positions pockets and the knee break on trousers.',
    range: { min: 40, max: 80, typical: [55, 68] },
    steps: [
      'Start at the natural waist on the side of the body.',
      'Run the tape straight down to the centre of the kneecap.',
      'Keep the tape flat against the side of the leg.',
    ],
    mistakes: [
      'Letting the tape drift toward the front of the leg.',
      'Starting at the hip rather than the natural waist.',
    ],
    needs: ['tape', 'helper'],
  },
  waist_to_ankle: {
    group: 'lower', label: 'Waist to ankle', unit: 'length',
    figure: 'leg',
    intro: 'Full outside length from waist to ankle or floor.',
    range: { min: 70, max: 130, typical: [95, 110] },
    steps: [
      'Start at the natural waist on the side of the body.',
      'Run the tape straight down the side to the ankle or floor.',
      'Measure barefoot unless the outfit needs specific shoes.',
    ],
    mistakes: [
      'Wearing heels or shoes when the design assumes barefoot.',
      'Bowing the tape away from the leg.',
    ],
    needs: ['tape', 'helper'],
  },

  // ---------------------------------------------------------------- general
  height: {
    group: 'general', label: 'Height', unit: 'length',
    figure: 'fullbody',
    intro: 'Overall height, used for proportion and drape.',
    range: { min: 100, max: 230, typical: [150, 200] },
    steps: [
      'Stand barefoot with heels and back against a wall.',
      'Look straight ahead, chin level.',
      'Mark the wall at the crown of the head and measure from the floor.',
    ],
    mistakes: [
      'Wearing shoes.',
      'Tilting the head up or down.',
    ],
    needs: ['tape', 'helper'],
  },
  weight: {
    group: 'general', label: 'Weight', unit: 'weight',
    figure: 'scale',
    intro: 'Supports sizing decisions — it does not replace body measurements.',
    range: { min: 25, max: 250, typical: [45, 120] },
    steps: [
      'Use a reliable scale on a hard, level surface.',
      'Weigh in light clothing for consistency.',
      'Record the value shown.',
    ],
    mistakes: [
      'Using a scale on carpet, which reads unevenly.',
    ],
    needs: [],
  },
};

// Group metadata and derived orderings — everything downstream reads from GUIDES
// so the field list only has to be maintained in one place.
export const GROUP_META = [
  { id: 'core', label: 'Core fit', hint: 'Required for every garment' },
  { id: 'upper', label: 'Upper body', hint: 'Tops, jackets, sleeves' },
  { id: 'lower', label: 'Lower body', hint: 'Trousers, skirts' },
  { id: 'general', label: 'General', hint: 'Proportion and sizing' },
];

export const ALL_FIELDS = Object.keys(GUIDES);

export const GROUPS = GROUP_META.map((group) => ({
  ...group,
  fields: ALL_FIELDS.filter((field) => GUIDES[field].group === group.id),
}));

export const REQUIRED = ALL_FIELDS.filter((field) => GUIDES[field].required);

export const NEED_LABELS = {
  tape: 'Tape measure',
  mirror: 'A mirror',
  helper: 'A second person',
};

export const labelFor = (field) => GUIDES[field]?.label || field.replaceAll('_', ' ');
