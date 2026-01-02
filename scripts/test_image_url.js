// Test if the transformed URL works
const testUrl = 'https://drive.google.com/uc?export=view&id=1DK6-TtwzyL96M7mPBnUb9tby8XqWoUgj';

const idMatch = testUrl.match(/id=([^&]+)/);
if (idMatch && idMatch[1]) {
    const transformedUrl = `https://lh3.googleusercontent.com/d/${idMatch[1]}`;
    console.log('Original URL:', testUrl);
    console.log('Transformed URL:', transformedUrl);
    console.log('\nTry opening this in your browser:', transformedUrl);
}
