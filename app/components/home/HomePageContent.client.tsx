import { useState } from 'react';
import { useStore } from '@nanostores/react';
import { chatStore } from '~/lib/stores/chat';
import { HomeHero } from './HomeHero.client';
import { ProjectsSection } from './ProjectsSection';
import { Chat } from '~/components/chat/Chat.client';
import { classNames } from '~/utils/classNames';
import { ExamplePrompts } from '~/components/chat/ExamplePrompts';
import { ImportButtons } from '~/components/chat/chatExportAndImport/ImportButtons';
import GitCloneButton from '~/components/chat/GitCloneButton';
import { useChatHistory } from '~/lib/persistence/useChatHistory';
import Cookies from 'js-cookie';
import { PROMPT_COOKIE_KEY } from '~/utils/constants';

interface HomePageContentProps {
  children: React.ReactNode;
}

export function HomePageContent({ children }: HomePageContentProps) {
  const chat = useStore(chatStore);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [projectDescription, setProjectDescription] = useState('');
  const { importChat } = useChatHistory();

  // Show chat interface when chat has started, otherwise show home page
  const showChat = chat.started;

  const handleSelectPrompt = (suggestion: string) => {
    // Fill the input in HomeHero with the selected prompt
    setProjectDescription(suggestion);
    // Scroll to top to show the hero section with filled input
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // Focus on the textarea after a small delay
    setTimeout(() => {
      const textarea = document.querySelector('#project-description') as HTMLTextAreaElement;
      if (textarea) {
        textarea.focus();
        // Scroll textarea into view if needed
        textarea.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 300);
  };

  const handleProjectClick = (project: any) => {
    // Navigate to project or open project
    if (project.urlId || project.id) {
      const urlId = project.urlId || project.id;
      window.location.href = `/chat/${urlId}`;
    }
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
              <div className="w-full">
                <HomeHero
                  onGenerateProject={(description) => {
                    // Chat component will handle this via cookie
                    setProjectDescription(description);
                  }}
                  setUploadedFiles={setUploadedFiles}
                  uploadedFiles={uploadedFiles}
                  initialDescription={projectDescription}
                />
                
                {/* Example Prompts */}
                <div className="mt-8">
                  <ExamplePrompts onSelectPrompt={handleSelectPrompt} />
                </div>
              </div>
            </section>

            {/* Import Buttons and Git Clone */}
            <section className="pt-4 pb-6 flex justify-center">
              <div className="flex items-center gap-2">
                {ImportButtons(importChat)}
                <GitCloneButton importChat={importChat} />
              </div>
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

