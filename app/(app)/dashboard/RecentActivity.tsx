import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Clock,
  User,
  Edit,
  Plus,
  Trash2,
  Eye,
  ChevronRight
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';

interface Activity {
  action: string;
  entity_type: string;
  entity_id: number;
  user_name: string;
  timestamp: string;
  details: string;
}

interface RecentActivityProps {
  activities: Activity[];
}

export default function RecentActivity({ activities }: RecentActivityProps) {
  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case 'create':
        return <Plus className="h-4 w-4" />;
      case 'update':
        return <Edit className="h-4 w-4" />;
      case 'delete':
        return <Trash2 className="h-4 w-4" />;
      default:
        return <Eye className="h-4 w-4" />;
    }
  };

  const getEntityColor = (entity: string) => {
    switch (entity.toLowerCase()) {
      case 'tire':
        return 'bg-blue-100 text-blue-800';
      case 'vehicle':
        return 'bg-green-100 text-green-800';
      case 'purchase_order':
        return 'bg-purple-100 text-purple-800';
      case 'supplier':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Recent Activity
        </CardTitle>
        <Badge variant="outline">
          {activities.length} Activities
        </Badge>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-72">
          {activities.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No recent activity</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map((activity, index) => (
                <div key={index} className="flex items-start gap-3 pb-4 border-b last:border-0 last:pb-0">
                  <div className="mt-1">
                    <div className="p-2 rounded-full bg-gray-100">
                      {getActionIcon(activity.action)}
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm truncate">
                        {activity.details}
                      </span>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>{activity.user_name}</span>
                      </div>
                      
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${getEntityColor(activity.entity_type)}`}
                      >
                        {activity.entity_type}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        
        {activities.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <Button variant="outline" className="w-full">
              View All Activity
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}