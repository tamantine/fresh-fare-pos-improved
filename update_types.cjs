
const fs = require('fs');
const path = require('path');

// Adjusted path to use consistent slashes or rely on node handling
// This path needs to be updated with the new step ID from the generate_typescript_types call
// Since I don't know the step ID yet, I will use a placeholder or better yet, I should wait for the step ID.
// Wait, I can't know the step ID before I make the call.
// The output file path is unpredictable.
// Strategy: I will check the output of generate_typescript_types first, then write the script with the correct path.
// BUT I want to parallelize.
// No, I can't parallelize if I need the output path.
// However, the `generate_typescript_types` output is large and saved to a file.
// The file path is returned in the tool output.
// I can just list the directory `.system_generated/steps` and pick the latest one? No that's risky.
// I will just wait for the tool output.
// Actually, I can write the script to accept a command line argument for the input file!
// That way I don't need to hardcode the path inside the script. Smart.

const inputPath = process.argv[2];
const outputPath = 'src/integrations/supabase/types.ts';

if (!inputPath) {
    console.error('Please provide input file path as argument');
    process.exit(1);
}

try {
    console.log(`Reading from: ${inputPath}`);
    const content = fs.readFileSync(inputPath, 'utf8');

    const json = JSON.parse(content);
    if (json.types) {
        const absOutputPath = path.resolve(process.cwd(), outputPath);
        console.log(`Writing to: ${absOutputPath}`);
        fs.writeFileSync(absOutputPath, json.types);
        console.log('Successfully updated types.ts');
    } else {
        console.error('No "types" key in JSON.');
    }
} catch (err) {
    console.error('Error:', err);
    process.exit(1);
}
