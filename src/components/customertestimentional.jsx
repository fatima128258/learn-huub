import Image from 'next/image'
import OverlappingAvatars from './OverlappingAvatars'


const userTestimonials = [
  {
    id: 1,
    name: 'Sarah Johnson',
    avatar: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQA3GQ_e-0c5P22nmUnExHDhWL892gydHlwcQ&s',
    country: 'USA',
    rating: 5,
    review: 'Excellent service! Got my ticket in 30 minutes.'
  },
  {
    id: 2,
    name: 'Ahmed Hassan',
    avatar: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSJMQUD1dslHyMRd5HUrv3OT7USMi-xMskbaA&s',
    country: 'UAE',
    rating: 5,
    review: 'Very professional and reliable service.'
  },
  {
    id: 3,
    name: 'Emma Wilson',
    avatar: 'https://media.istockphoto.com/id/1440526929/photo/close-up-studio-portrait-of-a-cheerful-13-year-old-teenager-boy-in-a-white-t-shirt-against-a.jpg?s=612x612&w=0&k=20&c=evmv_0gA8yZRW11HFLR1F_xYKqLCDbZ8haJa_m8pbkQ=',
    country: 'UK',
    rating: 5,
    review: 'Perfect for visa applications, highly recommended!'
  },
  {
    id: 4,
    name: 'Carlos Rodriguez',
    avatar: 'data:image/jpeg;base64,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',
    country: 'Spain',
    rating: 5,
    review: 'Fast delivery and authentic-looking tickets.'
  }
]

const totalUsers = '4k'
const averageRating = '5.0'

const TestimonialsSection = () => {
  return (
    <div id='testimonials-section' className='space-y-3 sm:space-y-4'>

      {/* Trust Text */}
      <p
        id='trust-text'
        className='text-[#6f7071] text-xs tracking-tight sm:text-sm text-center xl:-mt-2 lg:text-left'
      >
        Trusted By Clients From Worldwide.
      </p>

      
      <OverlappingAvatars
        users={userTestimonials}
        totalUsers={totalUsers}
        avatarSize='w-10 h-10 sm:w-12 sm:h-12 lg:w-10 lg:h-10'
      />

      <div id='testimonials-grid' className='hidden grid-cols-2 gap-4 mt-4'>
        {userTestimonials.map(user => (
          <div
            key={user.id}
            id={`testimonial-${user.id}`}
            className='bg-white p-4 rounded-lg shadow-sm border border-gray-100'
          >
            <div className='flex items-center space-x-3 mb-2'>
              <Image
                src={user.avatar}
                alt={user.name}
                width={32}
                height={32}
                className='w-8 h-8 rounded-full object-cover'
              />
              <div>
                <div className='font-medium text-sm text-gray-900'>
                  {user.name}
                </div>
                <div className='text-xs text-gray-500'>{user.country}</div>
              </div>
            </div>
            <p className='text-sm text-gray-600'>{user.review}</p>
            <div className='flex items-center mt-2'>
              {[...Array(user.rating)].map((_, i) => (
                <Image
                  key={i}
                  src='/star.svg'
                  alt='Star'
                  width={12}
                  height={12}
                  className='text-yellow-400'
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default TestimonialsSection
