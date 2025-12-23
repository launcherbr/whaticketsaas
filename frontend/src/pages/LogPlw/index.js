import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { toast } from "react-toastify";
import { useHistory } from "react-router-dom";
import { AuthContext } from "../../context/Auth/AuthContext";
import { FiGitBranch, FiClock, FiCode, FiCheckCircle } from 'react-icons/fi';
import styled from 'styled-components';

// Componentes estilizados
const Container = styled.div`
  padding: 2rem;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  max-width: 800px;
  margin: 0 auto;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 2.5rem;
`;

const Title = styled.h2`
  color: #2c3e50;
  font-size: 2rem;
  margin-bottom: 0.5rem;
  font-weight: 600;
`;

const Subtitle = styled.p`
  color: #7f8c8d;
  font-size: 1rem;
`;

const VersionCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  border-left: 4px solid #3498db;
  transition: transform 0.2s, box-shadow 0.2s;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
  }
`;

const VersionTitle = styled.h3`
  color: #2c3e50;
  font-size: 1.3rem;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ChangeList = styled.ul`
  padding-left: 1rem;
  list-style-type: none;
`;

const ChangeItem = styled.li`
  margin-bottom: 0.75rem;
  padding-left: 1.5rem;
  position: relative;
  color: #34495e;
  line-height: 1.5;
  
  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0.5rem;
    width: 8px;
    height: 8px;
    background-color: #3498db;
    border-radius: 50%;
  }
`;

const Loading = styled.div`
  text-align: center;
  padding: 2rem;
  color: #7f8c8d;
  font-size: 1.2rem;
`;

const ErrorMessage = styled.div`
  text-align: center;
  padding: 2rem;
  color: #e74c3c;
  font-size: 1.2rem;
  background: #fde8e8;
  border-radius: 8px;
`;

const VersionLog = () => {
  const [versionLog, setVersionLog] = useState([]);
  const history = useHistory();
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    if (!user.super) {
      toast.error("Esta empresa não possui permissão para acessar essa página! Estamos lhe redirecionando.");
      setTimeout(() => {
        history.push(`/`)
      }, 1000);
    }
  }, [user, history]);

  useEffect(() => {
    const fetchReadme = async () => {
      try {
        const response = await axios.get(
          'https://api.github.com/repos/plwdesign/attwhaticket/contents/README.md'
        );
        const decodedContent = decodeBase64(response.data.content);
        const parsedLog = parseVersionLog(decodedContent);
        setVersionLog(parsedLog);
        setLoading(false);
      } catch (error) {
        setError('Erro ao carregar o log de versões. Por favor, tente novamente mais tarde.');
        setLoading(false);
      }
    };

    fetchReadme();
  }, []);

  const decodeBase64 = (str) => {
    return decodeURIComponent(
      Array.prototype.map
        .call(atob(str), (c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join('')
    );
  };

  const parseVersionLog = (content) => {
    const versions = content.split('## ').slice(1);
    return versions.map(versionText => {
      const [title, ...changes] = versionText.split('\n').filter(line => line.trim() !== '');
      return {
        version: title.trim(),
        changes: changes.map(change => change.trim().replace(/^[-•]\s*/, '').trim())
      };
    }).map(log => ({
      ...log,
      changes: log.changes.map(change => formatMarkdown(change))
    }));
  };

  const formatMarkdown = (text) => {
    // Processa links [texto](url)
    let formatted = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" style="color: #3498db; text-decoration: none;">$1</a>');
    
    // Processa negrito **texto** ou __texto__
    formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
                         .replace(/__([^_]+)__/g, '<strong>$1</strong>');
    
    // Processa itálico *texto* ou _texto_
    formatted = formatted.replace(/\*([^*]+)\*/g, '<em>$1</em>')
                         .replace(/_([^_]+)_/g, '<em>$1</em>');
    
    // Processa código `texto`
    formatted = formatted.replace(/`([^`]+)`/g, '<code style="background: #f5f5f5; padding: 0.2em 0.4em; border-radius: 3px; font-family: monospace;">$1</code>');
    
    return formatted;
  };

  if (loading) return (
    <Loading>
      <FiClock size={24} style={{ marginBottom: '1rem' }} />
      <p>Carregando histórico de versões...</p>
    </Loading>
  );
  
  if (error) return <ErrorMessage>{error}</ErrorMessage>;

  return (
    <Container>
      <Header>
        <FiGitBranch size={48} color="#3498db" style={{ marginBottom: '1rem' }} />
        <Title>Histórico de Atualizações</Title>
        <Subtitle>Confira as melhorias e novidades implementadas em cada versão</Subtitle>
      </Header>
      
      {versionLog.map(({ version, changes }) => (
        <VersionCard key={version}>
          <VersionTitle>
            <FiCode color="#3498db" />
            {version}
          </VersionTitle>
          <ChangeList>
            {changes.map((change, index) => (
              <ChangeItem 
                key={index} 
                dangerouslySetInnerHTML={{ __html: change }} 
              />
            ))}
          </ChangeList>
        </VersionCard>
      ))}
    </Container>
  );
};

export default VersionLog;