import mongoose, { Schema, Document } from "mongoose";

export interface IResource extends Document {
  title: string;
  description: string;
  url: string;
  image: string | null;
  audioUrl?: string | null;
  videoUrl?: string | null;
  source: string;  // Platform or website source (e.g., "ESPNFantasyFootball", "YouTube")
  author?: string | null;  // Author name or content creator/channel
  category: string;  // Content type like "Article", "Video", "Podcast", etc.
  tags: string[];  // Flexible labels such as "Start/Sit", "Waiver Wire", "Rankings", etc.
  keywords: string[];  // Extracted important terms like player names, teams, fantasy football keywords
  pubDate: Date;
  fetchedAt: Date;
  rawFeedItem: object | null;
  favoritedBy: mongoose.Types.ObjectId[];
  creatorId?: mongoose.Types.ObjectId | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const FALLBACK_IMAGE_URL = "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop&q=80";

const ResourceSchema: Schema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    url: { type: String, required: true }, // Removed unique: true since we have a separate index
    image: { 
      type: String, 
      default: FALLBACK_IMAGE_URL,
      set: function(value: string | null | undefined) {
        // Apply fallback logic: if value is null, undefined, or empty string, use fallback
        return value && value.trim() !== "" ? value : FALLBACK_IMAGE_URL;
      }
    },
    audioUrl: { type: String, default: null },
    videoUrl: { type: String, default: null },
    source: { type: String, required: true },  // Platform or website source
    author: { type: String, default: null },   // Author name or content creator/channel
    category: { type: String, required: true }, // Content type
    tags: { type: [String], default: [] },     // Flexible labels
    keywords: { type: [String], default: [] }, // Extracted important terms (player names, teams, etc.)
    pubDate: { type: Date, required: true },
    fetchedAt: { type: Date, required: true, default: () => new Date() },
    rawFeedItem: { type: Schema.Types.Mixed, default: null },
    favoritedBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
    creatorId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Production indexes for optimal query performance
ResourceSchema.index({ url: 1 }, { unique: true });           // Unique constraint on URL
ResourceSchema.index({ pubDate: -1 });                       // Sort by publication date (newest first)
ResourceSchema.index({ category: 1 });                       // Filter by category
ResourceSchema.index({ source: 1 });                         // Filter by source
ResourceSchema.index({ tags: 1 });                           // Filter by tags
ResourceSchema.index({ keywords: 1 });                       // Filter by keywords (player names, teams, etc.)
ResourceSchema.index({ isActive: 1 });                       // Filter by active status
ResourceSchema.index({ favoritedBy: 1 });                    // User favorites queries
ResourceSchema.index({ author: 1 });                         // Filter by author
ResourceSchema.index({ "title": "text", "description": "text" }); // Full-text search on title and description

export default mongoose.models.Resource || mongoose.model<IResource>("Resource", ResourceSchema);
