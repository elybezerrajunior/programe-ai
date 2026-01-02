import { useState } from 'react';
import { useStore } from '@nanostores/react';
import { chatStore } from '~/lib/stores/chat';
import { HomeHero } from './HomeHero.client';
import { ProjectTypeTags } from './ProjectTypeTags';
import { ProjectsSection } from './ProjectsSection';
import { Chat } from '~/components/chat/Chat.client';
import { classNames } from '~/utils/classNames';

interface HomePageContentProps {
  children: React.ReactNode;
}

export function HomePageContent({ children }: HomePageContentProps) {
  const chat = useStore(chatStore);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

  // Show chat interface when chat has started, otherwise show home page
  const showChat = chat.started;

  const handlePromptTips = () => {
    // Open prompt tips modal or navigate to tips page
    // This could open a dialog with prompt tips
    console.log('Prompt tips clicked');
  };

  const handleAttachFiles = () => {
    // Handle file attachment - this could trigger file input
    console.log('Attach files clicked');
  };

  const handleProjectClick = (project: any) => {
    // Navigate to project or open project
    console.log('Project clicked:', project);
  };

  const handleNewProjectClick = () => {
    // Start new project - scroll to top to show the hero section
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      {/* Always render Chat component - it needs to be mounted to pick up cookie values and handle state */}
      <div className={classNames('flex-1 overflow-hidden', { 'hidden': !showChat })}>
        {children}
      </div>
      
      {/* Show home page when chat hasn't started */}
      {!showChat && (
        <div className="flex-1 overflow-y-auto">
          <div className="min-h-full flex flex-col">
            {/* Hero Section */}
            <section className="flex-1 flex items-center justify-center pt-12">
              <HomeHero
                onAttachFiles={handleAttachFiles}
                onPromptTips={handlePromptTips}
              />
            </section>

            {/* Project Type Tags */}
            <section className="pt-0 pb-10">
              <ProjectTypeTags
                selectedTypes={selectedTypes}
                onTypeSelect={(typeId) => {
                  setSelectedTypes((prev) =>
                    prev.includes(typeId) ? prev.filter((id) => id !== typeId) : [...prev, typeId]
                  );
                }}
              />
            </section>

            {/* Projects Section */}
            <section className="py-8 border-t border-bolt-elements-borderColor">
              <ProjectsSection
                onProjectClick={handleProjectClick}
                onNewProjectClick={handleNewProjectClick}
              />
            </section>
          </div>
        </div>
      )}
    </>
  );
}

