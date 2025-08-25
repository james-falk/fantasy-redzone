const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
async function connectToDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

// Update Draft Sharks articles
async function updateDraftSharksImages() {
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

    // Find all Draft Sharks articles
    const draftSharksArticles = await Resource.find({
      $or: [
        { 'rawFeedItem.sourceName': { $regex: /draft sharks/i } },
        { source: 'RSS', 'rawFeedItem.sourceName': { $regex: /draft sharks/i } }
      ]
    });

    console.log(`Found ${draftSharksArticles.length} Draft Sharks articles`);

    // Update each article to use the new fallback image
    let updatedCount = 0;
    for (const article of draftSharksArticles) {
      // Check if the current image is the old favicon URL
      if (article.image && article.image.includes('draftsharks.com/favicon.ico')) {
        await Resource.findByIdAndUpdate(article._id, {
          image: '/fallback-images/draftsharks-fallback.jpeg',
          updatedAt: new Date()
        });
        updatedCount++;
        console.log(`✅ Updated article: ${article.title}`);
      }
    }

    console.log(`\n🎉 Successfully updated ${updatedCount} Draft Sharks articles`);
    console.log('New fallback image: /fallback-images/draftsharks-fallback.jpeg');

  } catch (error) {
    console.error('❌ Error updating Draft Sharks images:', error);
  }
}

// Main execution
async function main() {
  await connectToDatabase();
  await updateDraftSharksImages();
  await mongoose.disconnect();
  console.log('✅ Disconnected from MongoDB');
}

main().catch(console.error);
