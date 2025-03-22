
import React, { useState } from 'react';
import { MessageCircle, Star, Search, Filter, ArrowUpDown, Loader2, Flag, ThumbsUp, Reply } from 'lucide-react';
import ToolLayout from '@/components/ToolLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface Review {
  id: string;
  title: string;
  rating: number;
  content: string;
  author: string;
  date: string;
  isVerified: boolean;
  isReplied: boolean;
  replyContent?: string;
}

const ReviewManagement = () => {
  const [reviews, setReviews] = useState<Review[]>([
    {
      id: "1",
      title: "Great product, highly recommend!",
      rating: 5,
      content: "This exceeded my expectations. The quality is excellent and it arrived earlier than expected. Will definitely buy from this seller again!",
      author: "John Smith",
      date: "2023-05-15",
      isVerified: true,
      isReplied: true,
      replyContent: "Thank you for your kind words, John! We're thrilled to hear you're enjoying the product."
    },
    {
      id: "2",
      title: "Good product but shipping was slow",
      rating: 3,
      content: "The product itself is fine, but it took almost two weeks to arrive when the listing said 3-5 days. Not sure if I'd order again due to shipping times.",
      author: "Sarah Johnson",
      date: "2023-06-02",
      isVerified: true,
      isReplied: false
    },
    {
      id: "3",
      title: "Not as described",
      rating: 2,
      content: "The color is different from what was shown in the pictures, and it feels cheaper than I expected for the price. Somewhat disappointed with this purchase.",
      author: "Mike Williams",
      date: "2023-06-10",
      isVerified: true,
      isReplied: false
    },
    {
      id: "4",
      title: "Perfect for my needs",
      rating: 5,
      content: "Exactly what I was looking for! Easy to set up and works perfectly. The customer service was also very helpful when I had a question.",
      author: "Emily Davis",
      date: "2023-06-18",
      isVerified: true,
      isReplied: false
    }
  ]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [replyDraft, setReplyDraft] = useState<{[key: string]: string}>({});
  const [replying, setReplying] = useState<string | null>(null);
  const [submittingReply, setSubmittingReply] = useState(false);
  const { toast } = useToast();
  
  const filteredReviews = reviews.filter(review => {
    const matchesSearch = review.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         review.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRating = filterRating ? review.rating === filterRating : true;
    return matchesSearch && matchesRating;
  });
  
  const sortedReviews = [...filteredReviews].sort((a, b) => {
    // Sort by date (most recent first)
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
  
  const handleStartReply = (reviewId: string) => {
    setReplying(reviewId);
    if (!replyDraft[reviewId]) {
      // Pre-fill with a template
      setReplyDraft({
        ...replyDraft,
        [reviewId]: `Thank you for your feedback! `
      });
    }
  };
  
  const handleCancelReply = () => {
    setReplying(null);
  };
  
  const handleSubmitReply = (reviewId: string) => {
    if (!replyDraft[reviewId]?.trim()) {
      toast({
        title: "Error",
        description: "Please enter a reply",
        variant: "destructive"
      });
      return;
    }
    
    setSubmittingReply(true);
    
    // Simulate API call with timeout
    setTimeout(() => {
      const updatedReviews = reviews.map(review => {
        if (review.id === reviewId) {
          return {
            ...review,
            isReplied: true,
            replyContent: replyDraft[reviewId]
          };
        }
        return review;
      });
      
      setReviews(updatedReviews);
      setReplying(null);
      setSubmittingReply(false);
      
      toast({
        title: "Reply Submitted",
        description: "Your response has been published",
      });
    }, 1000);
  };
  
  const handleFilterByRating = (rating: number | null) => {
    setFilterRating(rating === filterRating ? null : rating);
  };
  
  const renderStars = (rating: number) => {
    return Array(5).fill(0).map((_, index) => (
      <Star 
        key={index} 
        className={`h-4 w-4 ${index < rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`} 
      />
    ));
  };
  
  const getReviewSummary = () => {
    const totalReviews = reviews.length;
    const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews;
    const repliedCount = reviews.filter(r => r.isReplied).length;
    const replyRate = Math.floor((repliedCount / totalReviews) * 100);
    
    return { totalReviews, averageRating, repliedCount, replyRate };
  };
  
  const summary = getReviewSummary();
  
  return (
    <ToolLayout 
      title="Review Management Tool" 
      icon={<MessageCircle className="h-6 w-6" />}
      description="Monitor and respond to customer reviews to build social proof and improve visibility."
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex flex-col items-center justify-center">
              <div className="text-3xl font-bold">{summary.totalReviews}</div>
              <p className="text-sm text-muted-foreground">Total Reviews</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 flex flex-col items-center justify-center">
              <div className="flex items-center gap-1 text-xl font-bold">
                {summary.averageRating.toFixed(1)}
                <Star className="h-5 w-5 text-amber-400 fill-amber-400" />
              </div>
              <p className="text-sm text-muted-foreground">Average Rating</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 flex flex-col items-center justify-center">
              <div className="text-3xl font-bold">{summary.repliedCount}</div>
              <p className="text-sm text-muted-foreground">Replies Sent</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 flex flex-col items-center justify-center">
              <div className="text-3xl font-bold">{summary.replyRate}%</div>
              <p className="text-sm text-muted-foreground">Reply Rate</p>
            </CardContent>
          </Card>
        </div>
        
        <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 items-start md:items-center justify-between">
          <div className="flex-1 max-w-md w-full relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search reviews..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">Filter by rating:</span>
            
            {[5, 4, 3, 2, 1].map(rating => (
              <Button
                key={rating}
                variant={filterRating === rating ? "default" : "outline"}
                size="sm"
                className={`px-2 ${filterRating === rating ? "bg-sellsmart-teal hover:bg-sellsmart-teal/90" : ""}`}
                onClick={() => handleFilterByRating(rating)}
              >
                {rating} <Star className="h-3 w-3 ml-1" />
              </Button>
            ))}
            
            {filterRating && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFilterRating(null)}
                className="text-muted-foreground"
              >
                Clear
              </Button>
            )}
          </div>
        </div>
        
        {sortedReviews.length > 0 ? (
          <div className="space-y-4">
            {sortedReviews.map((review) => (
              <Card key={review.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <div className="flex">
                            {renderStars(review.rating)}
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {new Date(review.date).toLocaleDateString()}
                          </span>
                        </div>
                        <h3 className="font-medium">{review.title}</h3>
                      </div>
                      
                      <div className="flex gap-2">
                        {review.rating <= 3 && !review.isReplied && (
                          <Button 
                            variant="outline"
                            size="sm"
                            className="h-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                          >
                            <Flag className="h-4 w-4" />
                          </Button>
                        )}
                        
                        {!review.isReplied && replying !== review.id && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8"
                            onClick={() => handleStartReply(review.id)}
                          >
                            <Reply className="h-4 w-4 mr-1" />
                            Reply
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-sm mb-2">{review.content}</p>
                    
                    <div className="flex items-center text-xs text-muted-foreground">
                      <span className="mr-2">By {review.author}</span>
                      {review.isVerified && (
                        <span className="flex items-center text-green-600">
                          <ThumbsUp className="h-3 w-3 mr-1" />
                          Verified Purchase
                        </span>
                      )}
                    </div>
                    
                    {review.isReplied && review.replyContent && (
                      <div className="mt-3 ml-4 pl-3 border-l-2 border-sellsmart-teal/30">
                        <div className="text-xs font-medium text-sellsmart-teal mb-1">
                          Your Response:
                        </div>
                        <p className="text-sm">{review.replyContent}</p>
                      </div>
                    )}
                    
                    {replying === review.id && (
                      <div className="mt-4 space-y-3">
                        <Textarea
                          placeholder="Write your reply..."
                          value={replyDraft[review.id] || ""}
                          onChange={(e) => setReplyDraft({
                            ...replyDraft,
                            [review.id]: e.target.value
                          })}
                          className="min-h-[100px]"
                        />
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCancelReply}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            className="bg-sellsmart-teal hover:bg-sellsmart-teal/90"
                            onClick={() => handleSubmitReply(review.id)}
                            disabled={submittingReply}
                          >
                            {submittingReply ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                Sending...
                              </>
                            ) : (
                              <>
                                <Reply className="h-4 w-4 mr-1" />
                                Submit Reply
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-muted rounded-lg">
            <MessageCircle className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-lg font-medium">No reviews found</h3>
            <p className="text-muted-foreground">
              {searchTerm || filterRating ? 
                "Try adjusting your search or filters" : 
                "You don't have any reviews yet"}
            </p>
          </div>
        )}
        
        <div className="bg-muted p-4 rounded-lg">
          <h3 className="font-medium mb-2">Tips for Responding to Reviews</h3>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Always thank the customer for their feedback, even for negative reviews</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Address specific points mentioned in the review</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>For negative reviews, offer a solution or way to make things right</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Keep responses professional and avoid defensive language</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Respond promptly, ideally within 24-48 hours</span>
            </li>
          </ul>
        </div>
      </div>
    </ToolLayout>
  );
};

export default ReviewManagement;
