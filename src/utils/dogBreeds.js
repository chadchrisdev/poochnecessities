// List of common dog breeds for dropdown options
export const DOG_BREEDS = [
  "Afghan Hound",
  "Akita",
  "Alaskan Malamute",
  "American Bulldog",
  "American Pit Bull Terrier",
  "Australian Cattle Dog",
  "Australian Shepherd",
  "Basset Hound",
  "Beagle",
  "Bernese Mountain Dog",
  "Bichon Frise",
  "Border Collie",
  "Boston Terrier",
  "Boxer",
  "Bulldog",
  "Cavalier King Charles Spaniel",
  "Chihuahua",
  "Chow Chow",
  "Cocker Spaniel",
  "Collie",
  "Corgi",
  "Dachshund",
  "Dalmatian",
  "Doberman Pinscher",
  "English Setter",
  "French Bulldog",
  "German Shepherd",
  "Golden Retriever",
  "Great Dane",
  "Greyhound",
  "Havanese",
  "Husky",
  "Jack Russell Terrier",
  "Labrador Retriever",
  "Lhasa Apso",
  "Maltese",
  "Mastiff",
  "Miniature Pinscher",
  "Miniature Schnauzer",
  "Newfoundland",
  "Pekingese",
  "Pointer",
  "Pomeranian",
  "Poodle",
  "Pug",
  "Rottweiler",
  "Saint Bernard",
  "Samoyed",
  "Shar Pei",
  "Shiba Inu",
  "Shih Tzu",
  "Staffordshire Bull Terrier",
  "Standard Schnauzer",
  "Vizsla",
  "Weimaraner",
  "Welsh Terrier",
  "West Highland White Terrier",
  "Whippet",
  "Yorkshire Terrier"
];

// Format breed string based on breed type and selections
export const formatBreedString = (breedType, primaryBreed, secondaryBreed) => {
  if (breedType === 'pure') {
    return primaryBreed;
  } else if (breedType === 'mixed') {
    if (secondaryBreed) {
      return `${primaryBreed} + ${secondaryBreed}`;
    } else {
      return `${primaryBreed} Mix`;
    }
  }
  return '';
};

// Parse a breed string into components
export const parseBreedString = (breedString) => {
  if (!breedString) {
    return {
      breedType: 'pure',
      primaryBreed: '',
      secondaryBreed: ''
    };
  }
  
  if (breedString.includes('+')) {
    // Mixed breed with secondary breed
    const [primary, secondary] = breedString.split('+').map(b => b.trim());
    return {
      breedType: 'mixed',
      primaryBreed: primary,
      secondaryBreed: secondary
    };
  } else if (breedString.includes('Mix')) {
    // Mixed breed without secondary breed
    const primary = breedString.replace(' Mix', '').trim();
    return {
      breedType: 'mixed',
      primaryBreed: primary,
      secondaryBreed: ''
    };
  } else {
    // Pure breed
    return {
      breedType: 'pure',
      primaryBreed: breedString,
      secondaryBreed: ''
    };
  }
}; 