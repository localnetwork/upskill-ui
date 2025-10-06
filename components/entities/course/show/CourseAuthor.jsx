import Link from "next/link";
import UserAvatar from "../../user/UserAvatar";
import { Medal, MonitorPlay, Star, StarOff, UsersRound } from "lucide-react";
export default function CourseAuthor({ author }) {
  return (
    <div>
      <div className="mb-2">
        <Link
          href={`/user/${author?.username}`}
          className="font-semibold underline text-[#0056D2] text-[20px]"
        >
          {author?.firstname} {author?.lastname}
        </Link>
      </div>
      <p className="font-light text-[18px]">
        Web Developer, Designer, and Teacher
      </p>

      <div className="flex mt-4">
        <div>
          <UserAvatar profile={author} size="xxl" />
        </div>
        <div className="pl-[30px]">
          <div className="flex items-center gap-2">
            <Star className="inline" size={15} />
            <p>4.7 Instructor Rating</p>
          </div>
          <div className="flex items-center gap-2">
            <Medal className="inline" size={15} />
            <p>10,000+ Reviews</p>
          </div>

          <div className="flex items-center gap-2">
            <UsersRound className="inline" size={15} />
            <p>1,000,000+ Students</p>
          </div>
          <div className="flex items-center gap-2">
            <MonitorPlay className="inline" size={15} />
            <p>50+ Courses</p>
          </div>
        </div>
      </div>

      <div className="mt-4 description-content font-light">
        <p>
          Hi, I'm Diome Nike! I'm one of Upskill's Top Instructors and all my
          premium courses have earned the best-selling status for outstanding
          performance and student satisfaction.
        </p>
        <p>
          I'm a full-stack web developer and designer with a passion for
          building beautiful web interfaces from scratch. I've been building
          websites and apps since 2010 and also have a Master's degree in I.T.
        </p>
        <p>
          I discovered my passion for teaching and helping others by sharing
          everything I knew during college. This passion led me to Upskill in
          2015, where I now have the privilege of training{" "}
          <strong>2,000,000+</strong> learners in the field of web development.
        </p>
        <p>
          What learners love the most about all my courses is the fact that I
          take the time to explain every single concept in a way that everyone
          can easily understand.
        </p>
      </div>
    </div>
  );
}
