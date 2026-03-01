const fs = require('fs');
const content = fs.readFileSync('app/src/pages/CharacterSheet.tsx', 'utf8');

const openTags = (content.match(/<div(\s|>)/g) || []).length;
const closeTags = (content.match(/<\/div>/g) || []).length;

console.log(`Open <div>: ${openTags}`);
console.log(`Close </div>: ${closeTags}`);
console.log(`Difference: ${openTags - closeTags}`);

// Also check for other tags that might be unbalanced
const openFragments = (content.match(/<>/g) || []).length;
const closeFragments = (content.match(/<\/>/g) || []).length;
console.log(`Open <>: ${openFragments}`);
console.log(`Close </>: ${closeFragments}`);
