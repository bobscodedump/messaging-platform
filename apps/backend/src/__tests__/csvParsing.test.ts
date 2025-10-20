import { describe, it, expect } from '@jest/globals';

// Copy the parseCsvLine function for testing
function parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];
        
        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                // Escaped quote
                current += '"';
                i++; // Skip next quote
            } else {
                // Toggle quote state
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            // Field separator
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current.trim());
    return result;
}

describe('parseCsvLine', () => {
    it('parses simple comma-separated values', () => {
        const result = parseCsvLine('a,b,c');
        expect(result).toEqual(['a', 'b', 'c']);
    });

    it('handles quoted fields with commas', () => {
        const result = parseCsvLine('a,"b,c",d');
        expect(result).toEqual(['a', 'b,c', 'd']);
    });

    it('handles quoted fields with spaces', () => {
        const result = parseCsvLine('name,"Hello, world!",type');
        expect(result).toEqual(['name', 'Hello, world!', 'type']);
    });

    it('handles multiple quoted fields', () => {
        const result = parseCsvLine('"first,name","last,name","email@test.com"');
        expect(result).toEqual(['first,name', 'last,name', 'email@test.com']);
    });

    it('handles escaped quotes inside quoted fields', () => {
        const result = parseCsvLine('a,"b""c",d');
        expect(result).toEqual(['a', 'b"c', 'd']);
    });

    it('handles empty fields', () => {
        const result = parseCsvLine('a,,c');
        expect(result).toEqual(['a', '', 'c']);
    });

    it('handles empty quoted fields', () => {
        const result = parseCsvLine('a,"",c');
        expect(result).toEqual(['a', '', 'c']);
    });

    it('trims whitespace from unquoted fields', () => {
        const result = parseCsvLine('  a  ,  b  ,  c  ');
        expect(result).toEqual(['a', 'b', 'c']);
    });

    it('trims whitespace even inside quoted fields (by design)', () => {
        // Note: We trim after extracting fields for consistency
        const result = parseCsvLine('a,"  b  ",c');
        expect(result).toEqual(['a', 'b', 'c']);
    });

    it('handles schedule CSV with complex content', () => {
        const line = 'Weekly Newsletter,WEEKLY,"Hi {{contact.firstName}}! Check out this week\'s updates.",,"VIP,All",,FR,,';
        const result = parseCsvLine(line);
        expect(result[0]).toBe('Weekly Newsletter');
        expect(result[1]).toBe('WEEKLY');
        expect(result[2]).toBe('Hi {{contact.firstName}}! Check out this week\'s updates.');
        expect(result[3]).toBe('');
        expect(result[4]).toBe('VIP,All');
    });

    it('handles contact CSV with address containing comma', () => {
        const line = 'John,Doe,+1234567890,john@example.com,"123 Main St, Apt 4","1990-01-01",Note,"Group1,Group2"';
        const result = parseCsvLine(line);
        expect(result[0]).toBe('John');
        expect(result[4]).toBe('123 Main St, Apt 4');
        expect(result[7]).toBe('Group1,Group2');
    });

    it('handles real schedule example with emoji', () => {
        const line = 'Birthday Greeting,BIRTHDAY,"Happy Birthday {{contact.firstName}}! 🎉 Have an amazing day!","Ada Lovelace,Grace Hopper",,,,,';
        const result = parseCsvLine(line);
        expect(result[0]).toBe('Birthday Greeting');
        expect(result[1]).toBe('BIRTHDAY');
        expect(result[2]).toBe('Happy Birthday {{contact.firstName}}! 🎉 Have an amazing day!');
        expect(result[3]).toBe('Ada Lovelace,Grace Hopper');
    });
});
