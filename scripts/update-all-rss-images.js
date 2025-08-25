const mongoose = require('mongoose');

// Connect to MongoDB
async function connectToDatabase() {
  try {
    // Use the MongoDB URI from environment or default to localhost
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/fantasy-red-zone';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

// Get fallback image based on source name
function getFallbackImage(sourceName) {
  const lowerSource = sourceName.toLowerCase();
  if (lowerSource.includes('espn')) {
    return '/fallback-images/espn-logo.png';
  } else if (lowerSource.includes('cbs')) {
    return '/fallback-images/cbs-logo.png';
  } else if (lowerSource.includes('nfl')) {
    return '/fallback-images/nfl-logo.png';
  } else if (lowerSource.includes('dynasty league football') || lowerSource.includes('dlf')) {
    return '/fallback-images/dynasty-league-football-fallback.jpeg';
  } else if (lowerSource.includes('dynasty nerds')) {
    return '/fallback-images/dynasty-nerds-fallback.jpeg';
  } else if (lowerSource.includes('draft sharks')) {
    return '/fallback-images/draftsharks-fallback.jpeg';
  } else {
    return '/fallback-images/news-default.svg';
  }
}

// Update all RSS articles
async function updateAllRSSImages() {
  try {
    const Resource = mongoose.model('Resource', new mongoose.Schema({
      title: String,
      description: String,
      url: String,
      image: String,
      source: String,
      author: String,
      category: String,
      tags: [String],
      keywords: [String],
      pubDate: Date,
      fetchedAt: Date,
      rawFeedItem: mongoose.Schema.Types.Mixed,
      favoritedBy: [mongoose.Schema.Types.ObjectId],
      creatorId: mongoose.Schema.Types.ObjectId,
      isActive: Boolean,
      createdAt: Date,
      updatedAt: Date
    }));

    // Find all RSS articles
    const rssArticles = await Resource.find({
      source: 'RSS'
    });

    console.log(`Found ${rssArticles.length} RSS articles`);

    // Update each article to use the new fallback image
    let updatedCount = 0;
    const sourceUpdates = {};

    for (const article of rssArticles) {
      const sourceName = article.rawFeedItem?.sourceName || 'Unknown';
      const newFallbackImage = getFallbackImage(sourceName);
      
      // Check if the current image is an old favicon URL or needs updating
      const currentImage = article.image || '';
      const shouldUpdate = currentImage.includes('favicon.ico') || 
                          currentImage.includes('placeholder.com') ||
                          currentImage.includes('unsplash.com') ||
                          currentImage.includes('via.placeholder.com');

      if (shouldUpdate) {
        await Resource.findByIdAndUpdate(article._id, {
          image: newFallbackImage,
          updatedAt: new Date()
        });
        updatedCount++;
        
        // Track updates by source
        if (!sourceUpdates[sourceName]) {
          sourceUpdates[sourceName] = 0;
        }
        sourceUpdates[sourceName]++;
        
        console.log(`✅ Updated ${sourceName}: ${article.title}`);
      }
    }

    console.log(`\n🎉 Successfully updated ${updatedCount} RSS articles`);
    console.log('\n📊 Updates by source:');
    Object.entries(sourceUpdates).forEach(([source, count]) => {
      console.log(`  ${source}: ${count} articles`);
    });

  } catch (error) {
    console.error('❌ Error updating RSS images:', error);
  }
}

// Main execution
async function main() {
  await connectToDatabase();
  await updateAllRSSImages();
  await mongoose.disconnect();
  console.log('✅ Disconnected from MongoDB');
}

main().catch(console.error);
