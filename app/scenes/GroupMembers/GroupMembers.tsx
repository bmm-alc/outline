import { observer } from "mobx-react";
import { PlusIcon } from "outline-icons";
import * as React from "react";
import { useTranslation, Trans } from "react-i18next";
import Group from "~/models/Group";
import User from "~/models/User";
import Button from "~/components/Button";
import Empty from "~/components/Empty";
import Flex from "~/components/Flex";
import Modal from "~/components/Modal";
import PaginatedList from "~/components/PaginatedList";
import Subheading from "~/components/Subheading";
import Text from "~/components/Text";
import usePolicy from "~/hooks/usePolicy";
import useStores from "~/hooks/useStores";
import useToasts from "~/hooks/useToasts";
import AddPeopleToGroup from "./AddPeopleToGroup";
import GroupMemberListItem from "./components/GroupMemberListItem";

type Props = {
  group: Group;
};

function GroupMembers({ group }: Props) {
  const [addModalOpen, setAddModalOpen] = React.useState(false);
  const { users, groupMemberships } = useStores();
  const { showToast } = useToasts();
  const { t } = useTranslation();
  const can = usePolicy(group.id);

  const handleAddModal = (state: boolean) => {
    setAddModalOpen(state);
  };

  const handleRemoveUser = async (user: User) => {
    try {
      await groupMemberships.delete({
        groupId: group.id,
        userId: user.id,
      });
      showToast(
        t(`{{userName}} was removed from the group`, {
          userName: user.name,
        }),
        {
          type: "success",
        }
      );
    } catch (err) {
      showToast(t("Could not remove user"), {
        type: "error",
      });
    }
  };

  return (
    <Flex column>
      {can.update ? (
        <>
          <Text type="secondary">
            <Trans
              defaults="Add and remove team members in the <em>{{groupName}}</em> group. Adding people to the group will give them access to any collections this group has been added to."
              values={{
                groupName: group.name,
              }}
              components={{
                em: <strong />,
              }}
            />
          </Text>
          <span>
            <Button
              type="button"
              onClick={() => handleAddModal(true)}
              icon={<PlusIcon />}
              neutral
            >
              {t("Add people")}…
            </Button>
          </span>
        </>
      ) : (
        <Text type="secondary">
          <Trans
            defaults="Listing team members in the <em>{{groupName}}</em> group."
            values={{
              groupName: group.name,
            }}
            components={{
              em: <strong />,
            }}
          />
        </Text>
      )}

      <Subheading>
        <Trans>Members</Trans>
      </Subheading>
      <PaginatedList
        items={users.inGroup(group.id)}
        fetch={groupMemberships.fetchPage}
        options={{
          id: group.id,
        }}
        empty={<Empty>{t("This group has no members.")}</Empty>}
        renderItem={(item: User) => (
          <GroupMemberListItem
            key={item.id}
            user={item}
            onRemove={can.update ? () => handleRemoveUser(item) : undefined}
          />
        )}
      />
      {can.update && (
        <Modal
          title={t(`Add people to {{groupName}}`, {
            groupName: group.name,
          })}
          onRequestClose={() => handleAddModal(false)}
          isOpen={addModalOpen}
        >
          <AddPeopleToGroup
            group={group}
            onSubmit={() => handleAddModal(false)}
          />
        </Modal>
      )}
    </Flex>
  );
}

export default observer(GroupMembers);
