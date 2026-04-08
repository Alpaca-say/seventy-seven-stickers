// schemas/sticker.js
// Drop this file into your Sanity Studio's schemas folder

export default {
  name: 'sticker',
  title: 'Sticker',
  type: 'document',
  fields: [
    {
      name: 'name',
      title: 'Sticker Name',
      type: 'string',
      validation: Rule => Rule.required().max(60),
    },
    {
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [
          { title: 'Anime',          value: 'anime'  },
          { title: 'Game On',        value: 'game'   },
          { title: 'Screen Legends', value: 'screen' },
          { title: 'Chillzone',      value: 'chill'  },
          { title: 'Wildcards',      value: 'wild'   },
        ],
        layout: 'radio',
      },
      validation: Rule => Rule.required(),
    },
    {
      name: 'image',
      title: 'Sticker Image',
      type: 'image',
      options: { hotspot: true },
      validation: Rule => Rule.required(),
    },
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'category',
      media: 'image',
    },
  },
};
