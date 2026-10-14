const fs = require('fs');
const path = require('path');

const modelsDir = path.join(__dirname, 'models');
const files = fs.readdirSync(modelsDir);

files.forEach(file => {
  if (file === 'Hotel.js') return;
  const filePath = path.join(modelsDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Check if hotelId already exists
  if (content.includes('hotelId:')) {
    console.log(`Skipped ${file} - hotelId already exists`);
    return;
  }

  // Regex to match new mongoose.Schema({ or new mongoose.Schema( {
  content = content.replace(/(new mongoose\.Schema\(\s*\{)/, `$1\n    hotelId: {\n      type: mongoose.Schema.Types.ObjectId,\n      ref: 'Hotel',\n      required: true\n    },`);

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated ${file}`);
});
