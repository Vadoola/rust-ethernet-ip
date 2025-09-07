import React from 'react';
import { TagListProps, TagValue } from '../types';
import TagCard from './TagCard';

const TagList: React.FC<TagListProps> = ({
  tags,
  onTagSelect,
  selectedTag
}) => {
  if (tags.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center text-gray-500">
          <div className="text-4xl mb-2">📊</div>
          <h3 className="text-lg font-medium mb-2">No Tags Available</h3>
          <p className="text-sm">
            Connect to a PLC and subscribe to tags to see real-time data here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Tag Values</h2>
        <span className="text-sm text-gray-500">{tags.length} tags</span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tags.map((tag) => (
          <div
            key={tag.tag_name}
            className={`cursor-pointer transition-all duration-200 ${
              selectedTag === tag.tag_name 
                ? 'ring-2 ring-primary-500 ring-opacity-50' 
                : 'hover:shadow-lg'
            }`}
            onClick={() => onTagSelect(tag)}
          >
            <TagCard
              tagValue={tag}
              isSubscribed={true} // Assume all displayed tags are subscribed
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default TagList;
