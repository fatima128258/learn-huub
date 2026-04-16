import Image from "next/image";

const OverlappingAvatars = ({ users, totalUsers }) => {
  return (
    <div className="flex items-center justify-center lg:justify-start">

      <div className="flex -space-x-2 sm:-space-x-3">
        {users.slice(0, 4).map((user, index) => (
          <div
            key={user.id}
            className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-white overflow-hidden"
            style={{ zIndex: 10 - index }}
          >
            <Image
              src={user.avatar}
              alt={user.name}
              fill
              className="object-cover"
            />
          </div>
        ))}
      </div>

      <span className="ml-2 sm:ml-3 text-xs sm:text-sm font-medium text-gray-700">
        {totalUsers}+ Users
      </span>

    </div>
  );
};

export default OverlappingAvatars;









// import Image from 'next/image'

// const OverlappingAvatars = ({ users, totalUsers, avatarSize = 'w-10 h-10' }) => {
//   return (
//     <div className="flex items-center">
//       <div className="flex items-center">
//         {users.slice(0, 4).map((user, index) => (
//           <div
//             key={user.id}
//             className={`
//               ${avatarSize}
//               rounded-full
//               border-2 border-white
//               overflow-hidden
//               bg-gray-200
//               ${index !== 0 ? '-ml-3' : ''}
//             `}
//             style={{ zIndex: 10 - index }}
//           >
//             <Image
//               src={user.avatar}
//               alt={user.name}
//               width={48}
//               height={48}
//               className="w-full h-full object-cover"
//             />
//           </div>
//         ))}
//       </div>

//       {totalUsers && (
//         <span className="ml-3 text-sm font-medium text-gray-700">
//           {totalUsers}+ Users
//         </span>
//       )}
//     </div>
//   )
// }

// export default OverlappingAvatars